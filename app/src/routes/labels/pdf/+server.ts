/**
 * POST /labels/pdf — Hoja A4 de etiquetas con QR en plantilla APLI.
 * Recibe el formulario de /labels (ids de equipos, plantilla, calibración).
 */
import { error, type RequestHandler } from '@sveltejs/kit';
import { PDFDocument, StandardFonts, rgb, type PDFFont } from 'pdf-lib';
import QRCode from 'qrcode';
import { hasRole } from '$lib/server/auth';
import { db, getSetting } from '$lib/server/db';
import { buildQrPayload } from '$lib/qr';
import { getPreset, labelsPerSheet } from '$lib/labels-presets';

const MM = 72 / 25.4; // puntos PDF por milímetro

type LabelItem = { code: string; categoryName: string | null; categoryCode: string | null };
type LabelOpts = {
	presetKey: string;
	offsetXmm?: number;
	offsetYmm?: number;
	startIndex?: number;
	showBorder?: boolean;
	centerName?: string;
};

async function qrPng(payload: string): Promise<string> {
	return QRCode.toDataURL(payload, { margin: 0, width: 512, errorCorrectionLevel: 'M' });
}

/** Reduce el tamaño de fuente hasta que el texto quepa en el ancho. */
function fitFontSize(font: PDFFont, text: string, maxWidthPt: number, start: number, min = 6): number {
	let size = start;
	while (size > min && font.widthOfTextAtSize(text, size) > maxWidthPt) size -= 0.5;
	return size;
}

async function generateLabelsPdf(items: LabelItem[], opts: LabelOpts): Promise<Uint8Array> {
	const preset = getPreset(opts.presetKey);
	const perSheet = labelsPerSheet(preset);
	const offX = (opts.offsetXmm ?? 0) * MM;
	const offY = (opts.offsetYmm ?? 0) * MM;

	const pdf = await PDFDocument.create();
	const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);
	const fontReg = await pdf.embedFont(StandardFonts.Helvetica);

	const qrCache = new Map<string, Awaited<ReturnType<typeof pdf.embedPng>>>();
	async function embedQr(payload: string) {
		let img = qrCache.get(payload);
		if (!img) {
			img = await pdf.embedPng(await qrPng(payload));
			qrCache.set(payload, img);
		}
		return img;
	}

	const pageWpt = preset.pageW * MM;
	const pageHpt = preset.pageH * MM;
	const labelWpt = preset.labelW * MM;
	const labelHpt = preset.labelH * MM;
	const pad = 2.5 * MM;

	let page = pdf.addPage([pageWpt, pageHpt]);
	let cell = opts.startIndex ?? 0;

	for (const item of items) {
		if (cell >= perSheet) {
			page = pdf.addPage([pageWpt, pageHpt]);
			cell = 0;
		}
		const col = cell % preset.cols;
		const row = Math.floor(cell / preset.cols);
		const x = (preset.marginLeft + col * (preset.labelW + preset.gutterX)) * MM + offX;
		const yTop = (preset.marginTop + row * (preset.labelH + preset.gutterY)) * MM - offY;
		const y = pageHpt - yTop - labelHpt;

		if (opts.showBorder) {
			page.drawRectangle({
				x,
				y,
				width: labelWpt,
				height: labelHpt,
				borderColor: rgb(0.85, 0.85, 0.85),
				borderWidth: 0.5
			});
		}

		const qrSize = labelHpt - 2 * pad;
		const img = await embedQr(buildQrPayload(item.code, item.categoryCode));
		page.drawImage(img, { x: x + pad, y: y + pad, width: qrSize, height: qrSize });

		const textX = x + pad + qrSize + pad;
		const textW = x + labelWpt - pad - textX;

		const codeSize = fitFontSize(fontBold, item.code, textW, 18);
		const codeY = y + labelHpt - pad - codeSize;
		page.drawText(item.code, {
			x: textX,
			y: codeY,
			size: codeSize,
			font: fontBold,
			color: rgb(0.06, 0.09, 0.16)
		});

		if (item.categoryName) {
			const catSize = fitFontSize(fontReg, item.categoryName, textW, 10);
			page.drawText(item.categoryName, {
				x: textX,
				y: codeY - catSize - 3,
				size: catSize,
				font: fontReg,
				color: rgb(0.28, 0.33, 0.4)
			});
		}

		if (opts.centerName) {
			const cSize = fitFontSize(fontReg, opts.centerName, textW, 8, 5);
			page.drawText(opts.centerName, {
				x: textX,
				y: y + pad,
				size: cSize,
				font: fontReg,
				color: rgb(0.55, 0.6, 0.66)
			});
		}
		cell++;
	}

	return pdf.save();
}

/** Uint8Array → ArrayBuffer exacto (lo que acepta Response sin pelear con los tipos). */
function toBody(bytes: Uint8Array): ArrayBuffer {
	return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!hasRole(locals.user, 'gestor')) throw error(403, 'Sin permisos.');

	const form = await request.formData();
	const preset = String(form.get('preset') ?? 'apli1274');
	const offsetX = Number(form.get('offset_x') ?? 0) || 0;
	const offsetY = Number(form.get('offset_y') ?? 0) || 0;
	const startIndex = Math.max(0, Number(form.get('start_index') ?? 0) || 0);
	const showBorder = form.get('border') === 'on';
	const includeCenter = form.get('center') === 'on';
	const ids = form
		.getAll('id')
		.map((v) => Number(v))
		.filter((n) => Number.isFinite(n));
	if (ids.length === 0) throw error(400, 'No se han seleccionado equipos.');

	const placeholders = ids.map(() => '?').join(',');
	const rows = db
		.prepare(
			`SELECT d.code, c.name AS category_name, c.code AS category_code
			 FROM devices d LEFT JOIN categories c ON c.id = d.category_id
			 WHERE d.id IN (${placeholders})
			 ORDER BY d.code`
		)
		.all(...ids) as { code: string; category_name: string | null; category_code: string | null }[];

	const items: LabelItem[] = rows.map((r) => ({
		code: r.code,
		categoryName: r.category_name,
		categoryCode: r.category_code
	}));

	const pdfBytes = await generateLabelsPdf(items, {
		presetKey: preset,
		offsetXmm: offsetX,
		offsetYmm: offsetY,
		startIndex,
		showBorder,
		centerName: includeCenter ? getSetting('center_name', '') : undefined
	});

	return new Response(toBody(pdfBytes), {
		headers: {
			'Content-Type': 'application/pdf',
			'Content-Disposition': `inline; filename="etiquetas-${preset}.pdf"`
		}
	});
};

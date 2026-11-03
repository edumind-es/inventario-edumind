/**
 * GET /loans/[id]/document?type=entrega|recogida|ambos
 * Acta de entrega y/o devolución en PDF (A4) para firmar en papel.
 */
import { error, type RequestHandler } from '@sveltejs/kit';
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFImage } from 'pdf-lib';
import QRCode from 'qrcode';
import { hasRole } from '$lib/server/auth';
import { getSetting } from '$lib/server/db';
import { getLoanFull, type LoanFull } from '$lib/server/queries';
import { buildQrPayload } from '$lib/qr';

const INK = rgb(0.06, 0.09, 0.16);
const MUTED = rgb(0.35, 0.4, 0.47);
const LINE = rgb(0.8, 0.83, 0.87);
const BRAND = rgb(0.059, 0.463, 0.431);

type ActaKind = 'entrega' | 'recogida';
type ActaData = LoanFull & {
	centerName: string;
	centerCode: string;
	centerLogo: string;
	lopdText: string;
};
type Assets = { font: PDFFont; bold: PDFFont; qrImg: PDFImage; logoImg: PDFImage | null };

function fmtDate(value: string | null | undefined): string {
	if (!value) return '';
	const iso = value.includes('T') ? value : value.replace(' ', 'T') + 'Z';
	const d = new Date(iso);
	if (isNaN(d.getTime())) return '';
	return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });
}

/** Parte un párrafo en líneas que quepan en maxWidth. */
function wrap(font: PDFFont, text: string, size: number, maxWidth: number): string[] {
	const words = text.split(/\s+/);
	const lines: string[] = [];
	let line = '';
	for (const w of words) {
		const test = line ? `${line} ${w}` : w;
		if (font.widthOfTextAtSize(test, size) > maxWidth && line) {
			lines.push(line);
			line = w;
		} else {
			line = test;
		}
	}
	if (line) lines.push(line);
	return lines;
}

async function embedLogo(pdf: PDFDocument, dataUrl: string): Promise<PDFImage | null> {
	if (!dataUrl || !dataUrl.startsWith('data:image/')) return null;
	try {
		const [meta, b64] = dataUrl.split(',');
		const bytes = Buffer.from(b64, 'base64');
		return meta.includes('png') ? await pdf.embedPng(bytes) : await pdf.embedJpg(bytes);
	} catch {
		return null;
	}
}

async function generateActas(data: ActaData, kinds: ActaKind[]): Promise<Uint8Array> {
	const pdf = await PDFDocument.create();
	const font = await pdf.embedFont(StandardFonts.Helvetica);
	const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
	const qrImg = await pdf.embedPng(
		await QRCode.toDataURL(buildQrPayload(data.device_code, data.category_code), {
			margin: 0,
			width: 256,
			errorCorrectionLevel: 'M'
		})
	);
	const logoImg = await embedLogo(pdf, data.centerLogo);
	for (const kind of kinds) {
		drawActa(pdf, { font, bold, qrImg, logoImg }, data, kind);
	}
	return pdf.save();
}

function drawActa(pdf: PDFDocument, assets: Assets, data: ActaData, kind: ActaKind) {
	const { font, bold, qrImg, logoImg } = assets;
	const page = pdf.addPage([595.28, 841.89]); // A4
	const M = 50;
	const right = 595.28 - M;
	const contentW = right - M;
	let y = 841.89 - M;
	const isEntrega = kind === 'entrega';

	const text = (s: string, x: number, yy: number, size: number, f: PDFFont = font, color = INK) =>
		page.drawText(s, { x, y: yy, size, font: f, color });

	// Cabecera: logo + centro + marca
	let headX = M;
	if (logoImg) {
		const logoH = 34;
		const scaled = logoImg.scale(logoH / logoImg.height);
		page.drawImage(logoImg, { x: M, y: y - logoH + 4, width: scaled.width, height: logoH });
		headX = M + scaled.width + 12;
	}
	text(data.centerName || 'Centro educativo', headX, y, 13, bold);
	if (data.centerCode) text(`Código: ${data.centerCode}`, headX, y - 15, 9, font, MUTED);
	text('Inventario EDUmind', right - font.widthOfTextAtSize('Inventario EDUmind', 9), y, 9, font, MUTED);
	y -= 28;
	page.drawLine({ start: { x: M, y }, end: { x: right, y }, thickness: 1, color: BRAND });
	y -= 30;

	// Título
	const title = isEntrega ? 'ACTA DE ENTREGA DE EQUIPAMIENTO' : 'ACTA DE DEVOLUCIÓN DE EQUIPAMIENTO';
	text(title, M + (contentW - bold.widthOfTextAtSize(title, 16)) / 2, y, 16, bold);
	y -= 16;
	const sub = `Préstamo nº ${data.id}`;
	text(sub, M + (contentW - font.widthOfTextAtSize(sub, 9)) / 2, y, 9, font, MUTED);
	y -= 26;

	const intro = isEntrega
		? `En ${data.centerName || 'el centro'}, con fecha ${fmtDate(data.checkout_at)}, se formaliza la ENTREGA en préstamo del equipamiento que se detalla, a la persona responsable abajo firmante, que declara recibirlo de conformidad.`
		: `En ${data.centerName || 'el centro'}, se formaliza la DEVOLUCIÓN del equipamiento que se detalla, entregado en préstamo con fecha ${fmtDate(data.checkout_at)}. El centro verifica su estado y funcionamiento.`;
	for (const line of wrap(font, intro, 10.5, contentW)) {
		text(line, M, y, 10.5, font);
		y -= 15;
	}
	y -= 12;

	// Caja: datos del equipo + QR
	const boxTop = y;
	const qrSize = 70;
	const rows: [string, string][] = [
		['Código del equipo', data.device_code],
		['Categoría', data.category_name || '—'],
		['Marca / Modelo', [data.brand, data.model].filter(Boolean).join(' ') || '—'],
		['Nº de serie', data.serial || '—']
	];
	const boxH = 20 + rows.length * 18 + 8;
	page.drawRectangle({ x: M, y: boxTop - boxH, width: contentW, height: boxH, borderColor: LINE, borderWidth: 1 });
	text('DATOS DEL EQUIPO', M + 12, boxTop - 16, 8, bold, BRAND);
	let ry = boxTop - 34;
	for (const [label, value] of rows) {
		text(label, M + 12, ry, 9, font, MUTED);
		text(value, M + 150, ry, 10, bold);
		ry -= 18;
	}
	page.drawImage(qrImg, {
		x: right - qrSize - 12,
		y: boxTop - boxH + (boxH - qrSize) / 2,
		width: qrSize,
		height: qrSize
	});
	y = boxTop - boxH - 20;

	// Caja: datos de la cesión
	const persTop = y;
	const persRows: [string, string][] = [
		['Persona responsable', data.borrower_name || ''],
		['Identificador / DNI', data.borrower_identifier || ''],
		['Fecha de entrega', fmtDate(data.checkout_at)],
		isEntrega
			? ['Devolución prevista', fmtDate(data.due_at)]
			: ['Fecha de devolución', fmtDate(data.returned_at)],
		['Registrado por', data.checked_out_by_name || '']
	];
	const persH = 20 + persRows.length * 18 + 8;
	page.drawRectangle({ x: M, y: persTop - persH, width: contentW, height: persH, borderColor: LINE, borderWidth: 1 });
	text('DATOS DE LA CESIÓN', M + 12, persTop - 16, 8, bold, BRAND);
	ry = persTop - 34;
	for (const [label, value] of persRows) {
		text(label, M + 12, ry, 9, font, MUTED);
		if (value) text(value, M + 150, ry, 10, bold);
		else
			page.drawLine({
				start: { x: M + 150, y: ry - 2 },
				end: { x: right - 20, y: ry - 2 },
				thickness: 0.6,
				color: LINE
			});
		ry -= 18;
	}
	y = persTop - persH - 20;

	// Observaciones
	text('ESTADO DEL EQUIPO Y OBSERVACIONES', M, y, 8, bold, BRAND);
	y -= 8;
	const obsH = 56;
	page.drawRectangle({ x: M, y: y - obsH, width: contentW, height: obsH, borderColor: LINE, borderWidth: 1 });
	if (data.notes) text(data.notes, M + 10, y - 16, 9.5, font, INK);
	else {
		for (let i = 1; i <= 2; i++)
			page.drawLine({
				start: { x: M + 10, y: y - i * 18 },
				end: { x: right - 10, y: y - i * 18 },
				thickness: 0.5,
				color: LINE
			});
	}
	y -= obsH + 18;

	// Condiciones
	const cond = isEntrega
		? 'La persona firmante recibe el equipo descrito y se compromete a hacer un uso responsable y exclusivamente educativo del mismo, a custodiarlo adecuadamente y a devolverlo en la fecha prevista en las mismas condiciones, salvo el desgaste normal por el uso. Cualquier incidencia, pérdida o daño deberá comunicarse al responsable del centro.'
		: 'Se deja constancia de la devolución del equipo descrito. Las observaciones sobre su estado, si las hubiera, quedan recogidas en el apartado anterior. Con la firma de este acta, el centro da por finalizada la cesión.';
	for (const line of wrap(font, cond, 8, contentW)) {
		text(line, M, y, 8, font, MUTED);
		y -= 11;
	}
	y -= 14;

	// Protección de datos (texto configurable por el centro)
	if (data.lopdText && data.lopdText.trim()) {
		text('PROTECCIÓN DE DATOS', M, y, 7, bold, BRAND);
		y -= 10;
		for (const line of wrap(font, data.lopdText.trim(), 7, contentW)) {
			text(line, M, y, 7, font, MUTED);
			y -= 9.5;
		}
	}
	y -= 22;

	// Firmas
	const colW = (contentW - 30) / 2;
	const sigY = y;
	const sigLabels = isEntrega
		? ['Por el centro (responsable)', 'La persona que recibe']
		: ['Por el centro (responsable)', 'La persona que devuelve'];
	[M, M + colW + 30].forEach((x, i) => {
		page.drawLine({ start: { x, y: sigY - 40 }, end: { x: x + colW, y: sigY - 40 }, thickness: 0.7, color: INK });
		text(sigLabels[i], x, sigY - 54, 9, bold);
		text('Nombre:', x, sigY - 72, 9, font, MUTED);
		text('DNI:', x, sigY - 90, 9, font, MUTED);
		text('Fecha:', x, sigY - 108, 9, font, MUTED);
		[72, 90, 108].forEach((dy) =>
			page.drawLine({
				start: { x: x + 45, y: sigY - dy - 2 },
				end: { x: x + colW, y: sigY - dy - 2 },
				thickness: 0.5,
				color: LINE
			})
		);
	});

	text(`Documento generado por Inventario EDUmind · ${data.centerName || ''}`, M, M - 14, 7.5, font, MUTED);
}

/** Uint8Array → ArrayBuffer exacto (lo que acepta Response sin pelear con los tipos). */
function toBody(bytes: Uint8Array): ArrayBuffer {
	return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

export const GET: RequestHandler = async ({ params, url, locals }) => {
	if (!hasRole(locals.user, 'gestor')) throw error(403, 'Sin permisos.');
	const loan = getLoanFull(Number(params.id));
	if (!loan) throw error(404, 'Préstamo no encontrado.');

	const type = url.searchParams.get('type') ?? 'ambos';
	const kinds: ActaKind[] =
		type === 'entrega' ? ['entrega'] : type === 'recogida' ? ['recogida'] : ['entrega', 'recogida'];

	const pdf = await generateActas(
		{
			...loan,
			centerName: getSetting('center_name', 'Centro educativo'),
			centerCode: getSetting('center_code', ''),
			centerLogo: getSetting('center_logo', ''),
			lopdText: getSetting('lopd_text', '')
		},
		kinds
	);

	const label = type === 'entrega' ? 'entrega' : type === 'recogida' ? 'recogida' : 'entrega-recogida';
	return new Response(toBody(pdf), {
		headers: {
			'Content-Type': 'application/pdf',
			'Content-Disposition': `inline; filename="acta-${label}-${loan.device_code}.pdf"`
		}
	});
};

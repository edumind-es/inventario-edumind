/**
 * Formato del QR de las etiquetas: `EDUMIND1|CÓDIGO|CATEGORÍA`.
 * Sin datos personales; la versión del formato va en el prefijo.
 */
export const QR_PREFIX = 'EDUMIND1';

export function buildQrPayload(deviceCode: string, categoryCode?: string | null): string {
	return `${QR_PREFIX}|${deviceCode}|${categoryCode ?? ''}`;
}

export type ParsedScan = { code: string; categoryCode: string | null };

/**
 * Interpreta lo que llega del escáner (cámara o lector USB) o de la caja de
 * texto: nuestro formato, una URL que termine en el código, o el código a secas.
 */
export function parseScan(raw: string): ParsedScan | null {
	const value = raw.trim();
	if (!value) return null;

	if (value.startsWith(QR_PREFIX + '|')) {
		const parts = value.split('|');
		const code = parts[1]?.trim();
		if (!code) return null;
		return { code, categoryCode: parts[2]?.trim() || null };
	}

	if (value.includes('/')) {
		const last = value.split(/[/?#]/).filter(Boolean).pop();
		if (last) return { code: last.toUpperCase(), categoryCode: null };
	}

	return { code: value.toUpperCase(), categoryCode: null };
}

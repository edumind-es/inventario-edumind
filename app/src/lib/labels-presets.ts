/**
 * Plantillas de etiquetas adhesivas (hojas A4 APLI). Medidas en mm.
 * Los centros ya usan estas referencias; se añaden aquí nuevas plantillas.
 */
export type LabelPreset = {
	key: string;
	name: string;
	ref: string;
	pageW: number;
	pageH: number;
	cols: number;
	rows: number;
	labelW: number;
	labelH: number;
	marginLeft: number;
	marginTop: number;
	gutterX: number;
	gutterY: number;
};

export const LABEL_PRESETS: LabelPreset[] = [
	{
		key: 'apli1274',
		name: '105 × 37 mm · 16 por hoja',
		ref: 'APLI 01274',
		pageW: 210,
		pageH: 297,
		cols: 2,
		rows: 8,
		labelW: 105,
		labelH: 37,
		marginLeft: 0,
		marginTop: 0.5,
		gutterX: 0,
		gutterY: 0
	},
	{
		key: 'apli1287',
		name: '105 × 35 mm · 16 por hoja',
		ref: 'APLI 01287',
		pageW: 210,
		pageH: 297,
		cols: 2,
		rows: 8,
		labelW: 105,
		labelH: 35,
		marginLeft: 0,
		marginTop: 8.5,
		gutterX: 0,
		gutterY: 0
	},
	{
		key: 'apli1783',
		name: '70 × 37 mm · 24 por hoja',
		ref: 'APLI 01783',
		pageW: 210,
		pageH: 297,
		cols: 3,
		rows: 8,
		labelW: 70,
		labelH: 37,
		marginLeft: 0,
		marginTop: 0.5,
		gutterX: 0,
		gutterY: 0
	}
];

export function getPreset(key: string): LabelPreset {
	return LABEL_PRESETS.find((p) => p.key === key) ?? LABEL_PRESETS[0];
}

export function labelsPerSheet(p: LabelPreset): number {
	return p.cols * p.rows;
}

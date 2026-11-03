/**
 * Rutas de datos compartidas — Inventario EDUmind
 * Debe coincidir con la lógica de src/lib/server/db.ts (defaultDataDir).
 */
import { join } from 'node:path';
import { homedir } from 'node:os';

export function defaultDataDir() {
	const home = homedir();
	if (process.platform === 'win32')
		return join(process.env.APPDATA ?? join(home, 'AppData', 'Roaming'), 'InventarioEDUmind');
	if (process.platform === 'darwin')
		return join(home, 'Library', 'Application Support', 'InventarioEDUmind');
	return join(process.env.XDG_DATA_HOME ?? join(home, '.local', 'share'), 'inventario-edumind');
}

export function dataDir() {
	if (process.env.EDUMIND_DB_PATH) {
		// Usa la carpeta del fichero indicado.
		return join(process.env.EDUMIND_DB_PATH, '..');
	}
	return defaultDataDir();
}

export function dbPath() {
	return process.env.EDUMIND_DB_PATH ?? join(defaultDataDir(), 'inventario.db');
}

export function modeFile() {
	return join(dataDir(), 'mode.txt');
}

/**
 * Supervisor de arranque — Inventario EDUmind
 * =====================================================================
 * Lanza el servidor y lo mantiene. Permite cambiar de modo (local/red)
 * o apagar desde la propia app, SIN terminal:
 *
 *   · el servidor sale con código 75  →  el supervisor lo reinicia
 *     (releyendo el modo guardado en mode.txt)
 *   · el servidor sale con código 0   →  apagado limpio, se termina
 *
 * Los lanzadores con icono ejecutan este archivo en segundo plano.
 */
import { spawn } from 'node:child_process';
import { readFileSync, openSync, writeSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { dataDir, modeFile } from './paths.mjs';

const RESTART_CODE = 75;
const serverPath = fileURLToPath(new URL('./server.mjs', import.meta.url));

function currentMode() {
	try {
		const m = readFileSync(modeFile(), 'utf8').trim().toLowerCase();
		if (m === 'red' || m === 'local') return m;
	} catch {
		/* sin fichero de modo todavía */
	}
	return (process.env.EDUMIND_MODE || '').toLowerCase() === 'red' ? 'red' : 'local';
}

// Registro para diagnóstico (no hay terminal visible).
mkdirSync(dataDir(), { recursive: true });
const logFd = openSync(join(dataDir(), 'server.log'), 'a');
const note = (msg) => writeSync(logFd, `[${new Date().toISOString()}] ${msg}\n`);

let child = null;
let stopping = false;

function start() {
	const mode = currentMode();
	note(`arrancando en modo ${mode}`);
	child = spawn(process.execPath, ['--experimental-sqlite', serverPath], {
		env: { ...process.env, EDUMIND_MODE: mode, EDUMIND_SUPERVISED: '1' },
		stdio: ['ignore', logFd, logFd]
	});
	child.on('exit', (code) => {
		if (stopping) return;
		if (code === RESTART_CODE) {
			note('reinicio solicitado (cambio de modo)');
			start();
		} else {
			note(`apagado (código ${code})`);
			process.exit(code ?? 0);
		}
	});
}

for (const sig of ['SIGINT', 'SIGTERM']) {
	process.on(sig, () => {
		stopping = true;
		if (child) child.kill('SIGTERM');
		process.exit(0);
	});
}

start();

/**
 * Empaquetado — Inventario EDUmind
 * =====================================================================
 * Genera los paquetes portables (ZIP) para Windows, macOS y Linux con el
 * runtime de Node incluido, y opcionalmente los .deb de Linux.
 *
 *   node scripts/package.mjs                      → todos los targets
 *   node scripts/package.mjs --targets linux-x64  → solo uno (lista separada por comas)
 *   node scripts/package.mjs --deb                → además genera los .deb (requiere dpkg-deb)
 *   node scripts/package.mjs --skip-build         → reutiliza build/ existente
 *   node scripts/package.mjs --node 22.23.1       → versión de Node a incluir
 *
 * Lo que va dentro de cada paquete:
 *   build/          salida de SvelteKit (adapter-node)
 *   node_modules/   SOLO dependencias de producción, instaladas con `npm ci --omit=dev`
 *                   (los paquetes 0.2.x se publicaron sin qrcode, pdf-lib y papaparse:
 *                   este script lo comprueba antes de cerrar el ZIP)
 *   runtime/        Node oficial descargado de nodejs.org y verificado con SHASUMS256
 *   scripts/        server.mjs, run.mjs, admin.mjs, paths.mjs
 *   package.json, ejemplos/, LEEME.txt y el lanzador de cada sistema (packaging/)
 *
 * Requisitos en la máquina que empaqueta: node ≥ 22, npm, zip, unzip, tar, xz.
 * No necesita Windows ni macOS: los lanzadores son ficheros de texto/plist.
 */
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
	cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync,
	chmodSync
} from 'node:fs';
import { createWriteStream } from 'node:fs';
import { pipeline } from 'node:stream/promises';
import { Readable } from 'node:stream';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');
const CACHE = join(DIST, '.cache');
const STAGE = join(DIST, '.stage');
const PKG = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
const VERSION = PKG.version;
const NAME = 'inventario-edumind';

/** Módulos que el servidor importa en tiempo de ejecución. Si falta uno → error 500. */
const REQUIRED_RUNTIME_MODULES = ['qrcode', 'pdf-lib', 'papaparse', 'selfsigned'];

const TARGETS = {
	'windows-x64': { node: 'win-x64', ext: 'zip', os: 'windows' },
	'macos-arm64': { node: 'darwin-arm64', ext: 'tar.gz', os: 'macos' },
	'macos-x64': { node: 'darwin-x64', ext: 'tar.gz', os: 'macos' },
	'linux-x64': { node: 'linux-x64', ext: 'tar.xz', os: 'linux', deb: 'amd64' },
	'linux-arm64': { node: 'linux-arm64', ext: 'tar.xz', os: 'linux', deb: 'arm64' }
};

/* ------------------------------ Argumentos ------------------------------ */
const args = process.argv.slice(2);
const opt = (name, def) => {
	const i = args.indexOf(`--${name}`);
	return i >= 0 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : def;
};
const flag = (name) => args.includes(`--${name}`);
const NODE_VERSION = opt('node', '22.23.1');
const targets = opt('targets', Object.keys(TARGETS).join(',')).split(',').map((t) => t.trim());
for (const t of targets) if (!TARGETS[t]) fail(`Target desconocido: ${t}`);

/* ------------------------------ Utilidades ------------------------------ */
function fail(msg) {
	console.error(`\n✖ ${msg}\n`);
	process.exit(1);
}
function log(msg) {
	console.log(`▸ ${msg}`);
}
function run(cmd, cmdArgs, cwd = ROOT) {
	const r = spawnSync(cmd, cmdArgs, { cwd, stdio: 'inherit' });
	if (r.status !== 0) fail(`Falló: ${cmd} ${cmdArgs.join(' ')}`);
}
function has(cmd) {
	return spawnSync('sh', ['-c', `command -v ${cmd}`], { stdio: 'ignore' }).status === 0;
}
function sha256(file) {
	return createHash('sha256').update(readFileSync(file)).digest('hex');
}
async function download(url, dest) {
	if (existsSync(dest)) return;
	log(`descargando ${url}`);
	const res = await fetch(url);
	if (!res.ok) fail(`No se pudo descargar ${url} (${res.status})`);
	mkdirSync(dirname(dest), { recursive: true });
	await pipeline(Readable.fromWeb(res.body), createWriteStream(dest));
}

/* ------------------------------ 1. Build ------------------------------ */
for (const tool of ['zip', 'unzip', 'tar']) if (!has(tool)) fail(`Hace falta el comando "${tool}".`);

if (!flag('skip-build')) {
	log('compilando (vite build)');
	run('npm', ['run', 'build']);
}
if (!existsSync(join(ROOT, 'build', 'handler.js'))) fail('No existe build/handler.js: compila primero.');

/* ------------------ 2. node_modules de producción ------------------ */
log('instalando dependencias de producción en dist/.stage');
rmSync(STAGE, { recursive: true, force: true });
mkdirSync(STAGE, { recursive: true });
cpSync(join(ROOT, 'package.json'), join(STAGE, 'package.json'));
cpSync(join(ROOT, 'package-lock.json'), join(STAGE, 'package-lock.json'));
run('npm', ['ci', '--omit=dev', '--ignore-scripts', '--no-audit', '--no-fund'], STAGE);

for (const m of REQUIRED_RUNTIME_MODULES) {
	if (!existsSync(join(STAGE, 'node_modules', m, 'package.json'))) {
		fail(`Falta el módulo "${m}" en node_modules de producción. No se empaqueta.`);
	}
}
log(`node_modules de producción OK (${REQUIRED_RUNTIME_MODULES.join(', ')})`);

/* ------------------------- 3. Runtime de Node ------------------------- */
async function fetchNode(target) {
	const { node, ext } = TARGETS[target];
	const base = `https://nodejs.org/dist/v${NODE_VERSION}`;
	const file = `node-v${NODE_VERSION}-${node}.${ext}`;
	const archive = join(CACHE, file);
	const sums = join(CACHE, `SHASUMS256-${NODE_VERSION}.txt`);
	await download(`${base}/SHASUMS256.txt`, sums);
	await download(`${base}/${file}`, archive);

	// Verificación de integridad contra el listado oficial.
	const line = readFileSync(sums, 'utf8').split('\n').find((l) => l.endsWith(`  ${file}`));
	if (!line) fail(`SHASUMS256.txt no contiene ${file}`);
	const expected = line.split(/\s+/)[0];
	if (sha256(archive) !== expected) {
		rmSync(archive, { force: true });
		fail(`SHA-256 incorrecto para ${file}; se ha borrado la descarga, vuelve a ejecutar.`);
	}

	// Extracción a una carpeta de caché por target.
	const extracted = join(CACHE, `node-v${NODE_VERSION}-${node}`);
	if (!existsSync(extracted)) {
		log(`extrayendo ${file}`);
		if (ext === 'zip') run('unzip', ['-q', '-o', archive, '-d', CACHE]);
		else run('tar', ['-xf', archive, '-C', CACHE]);
	}
	return extracted;
}

/* --------------------------- 4. Un paquete --------------------------- */
function copyCommon(out) {
	cpSync(join(ROOT, 'build'), join(out, 'build'), { recursive: true });
	cpSync(join(STAGE, 'node_modules'), join(out, 'node_modules'), { recursive: true });
	mkdirSync(join(out, 'scripts'), { recursive: true });
	for (const s of ['server.mjs', 'run.mjs', 'admin.mjs', 'paths.mjs']) {
		cpSync(join(ROOT, 'scripts', s), join(out, 'scripts', s));
	}
	// package.json mínimo: versión (la lee Ajustes) y "type": "module".
	writeFileSync(
		join(out, 'package.json'),
		JSON.stringify(
			{ name: NAME, version: VERSION, description: PKG.description, type: 'module', private: true },
			null,
			2
		) + '\n'
	);
	cpSync(join(ROOT, 'ejemplos'), join(out, 'ejemplos'), { recursive: true });
}

async function buildTarget(target) {
	const { os } = TARGETS[target];
	const folder = `${NAME}-${target}`;
	const out = join(DIST, folder);
	log(`── ${folder}`);
	rmSync(out, { recursive: true, force: true });
	mkdirSync(out, { recursive: true });
	copyCommon(out);

	const nodeDir = await fetchNode(target);
	if (os === 'windows') {
		// En Windows el ZIP oficial trae node.exe en la raíz → runtime/node.exe
		mkdirSync(join(out, 'runtime'), { recursive: true });
		cpSync(join(nodeDir, 'node.exe'), join(out, 'runtime', 'node.exe'));
		cpSync(join(ROOT, 'packaging', 'windows', 'Iniciar Inventario.vbs'), join(out, 'Iniciar Inventario.vbs'));
		cpSync(join(ROOT, 'packaging', 'windows', 'LEEME.txt'), join(out, 'LEEME.txt'));
	} else {
		// En Unix solo hace falta bin/node (sin npm, docs ni cabeceras)
		mkdirSync(join(out, 'runtime', 'bin'), { recursive: true });
		cpSync(join(nodeDir, 'bin', 'node'), join(out, 'runtime', 'bin', 'node'));
		chmodSync(join(out, 'runtime', 'bin', 'node'), 0o755);
	}
	if (os === 'macos') {
		const app = join(out, 'Inventario EDUmind.app');
		cpSync(join(ROOT, 'packaging', 'macos', 'app'), app, { recursive: true });
		chmodSync(join(app, 'Contents', 'MacOS', 'inventario'), 0o755);
		// La versión del bundle debe coincidir con package.json
		const plist = join(app, 'Contents', 'Info.plist');
		writeFileSync(plist, readFileSync(plist, 'utf8').replace(/<string>\d+\.\d+\.\d+<\/string>/g, `<string>${VERSION}</string>`));
		cpSync(join(ROOT, 'packaging', 'macos', 'LEEME.txt'), join(out, 'LEEME.txt'));
	}
	if (os === 'linux') {
		cpSync(join(ROOT, 'packaging', 'linux', 'iniciar-inventario.sh'), join(out, 'iniciar-inventario.sh'));
		chmodSync(join(out, 'iniciar-inventario.sh'), 0o755);
		cpSync(join(ROOT, 'packaging', 'linux', 'LEEME.txt'), join(out, 'LEEME.txt'));
	}

	// ZIP (desde dist/ para que la carpeta raíz vaya dentro)
	const zipName = `${folder}.zip`;
	rmSync(join(DIST, zipName), { force: true });
	run('zip', ['-q', '-r', '-9', '-y', zipName, folder], DIST);
	rmSync(out, { recursive: true, force: true });
	return zipName;
}

/* ----------------------------- 5. .deb ----------------------------- */
function buildDeb(target) {
	const arch = TARGETS[target].deb;
	if (!arch) return null;
	if (!has('dpkg-deb')) fail('Hace falta dpkg-deb para generar los .deb.');
	const name = `${NAME}_${VERSION}_${arch}`;
	const root = join(DIST, `.deb-${arch}`);
	rmSync(root, { recursive: true, force: true });
	const opt = join(root, 'opt', NAME);
	mkdirSync(opt, { recursive: true });
	copyCommon(opt);
	const nodeDir = join(CACHE, `node-v${NODE_VERSION}-${TARGETS[target].node}`);
	mkdirSync(join(opt, 'runtime', 'bin'), { recursive: true });
	cpSync(join(nodeDir, 'bin', 'node'), join(opt, 'runtime', 'bin', 'node'));
	chmodSync(join(opt, 'runtime', 'bin', 'node'), 0o755);
	cpSync(join(ROOT, 'packaging', 'deb', 'iniciar.sh'), join(opt, 'iniciar.sh'));
	chmodSync(join(opt, 'iniciar.sh'), 0o755);
	cpSync(join(ROOT, 'static', 'icons', 'icon-512.png'), join(opt, 'icon.png'));
	mkdirSync(join(root, 'usr', 'share', 'applications'), { recursive: true });
	cpSync(
		join(ROOT, 'packaging', 'deb', 'inventario-edumind.desktop'),
		join(root, 'usr', 'share', 'applications', 'inventario-edumind.desktop')
	);

	// Metadatos del paquete
	mkdirSync(join(root, 'DEBIAN'), { recursive: true });
	const sizeKb = Math.ceil(dirSize(opt) / 1024);
	writeFileSync(
		join(root, 'DEBIAN', 'control'),
		[
			`Package: ${NAME}`,
			`Version: ${VERSION}`,
			`Architecture: ${arch}`,
			`Maintainer: Luis Vilela Acuña <contacto@edumind.es>`,
			`Installed-Size: ${sizeKb}`,
			`Section: education`,
			`Priority: optional`,
			`Description: Inventario de recursos digitales para centros educativos`,
			` Aplicacion local-first y privacy-first para inventariar equipos,`,
			` gestionar prestamos y generar etiquetas QR. Node incluido.`,
			''
		].join('\n')
	);
	cpSync(join(ROOT, 'packaging', 'deb', 'postinst'), join(root, 'DEBIAN', 'postinst'));
	chmodSync(join(root, 'DEBIAN', 'postinst'), 0o755);

	log(`── ${name}.deb`);
	run('dpkg-deb', ['--build', '--root-owner-group', root, join(DIST, `${name}.deb`)]);
	rmSync(root, { recursive: true, force: true });
	return `${name}.deb`;
}

function dirSize(dir) {
	let total = 0;
	for (const e of readdirSync(dir, { withFileTypes: true })) {
		const p = join(dir, e.name);
		total += e.isDirectory() ? dirSize(p) : statSync(p).size;
	}
	return total;
}

/* ------------------------------ Principal ------------------------------ */
mkdirSync(DIST, { recursive: true });
const produced = [];
for (const t of targets) {
	produced.push(await buildTarget(t));
	if (flag('deb')) {
		const deb = buildDeb(t);
		if (deb) produced.push(deb);
	}
}

// SHA256SUMS.txt + version.json (la web de descargas los lee)
const sums = produced.map((f) => `${sha256(join(DIST, f))}  ${f}`).join('\n') + '\n';
writeFileSync(join(DIST, 'SHA256SUMS.txt'), sums);
writeFileSync(
	join(DIST, 'version.json'),
	JSON.stringify(
		{
			name: 'Inventario EDUmind',
			version: VERSION,
			date: new Date().toISOString().slice(0, 10),
			node: `v${NODE_VERSION}`,
			files: produced.map((f) => ({
				target: f.replace(`${NAME}-`, '').replace(/\.(zip|deb)$/, '').replace(`${NAME}_${VERSION}_`, 'linux-'),
				file: f,
				bytes: statSync(join(DIST, f)).size,
				sha256: sha256(join(DIST, f))
			}))
		},
		null,
		2
	) + '\n'
);
rmSync(STAGE, { recursive: true, force: true });

console.log('\n✔ Paquetes en dist/:');
for (const f of produced) console.log(`   ${f}`);
console.log('   SHA256SUMS.txt · version.json\n');

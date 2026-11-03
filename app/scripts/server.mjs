/**
 * Servidor de producción DUAL — Inventario EDUmind
 * =====================================================================
 * Un solo servidor, dos modos de arranque:
 *
 *   • MODO LOCAL (por defecto): escucha solo en 127.0.0.1 por HTTP.
 *     Funciona en cualquier situación, incluso sin red. Ideal cuando la
 *     red del centro es restrictiva (muchos centros públicos).
 *
 *   • MODO RED: escucha en toda la red local por HTTPS (certificado
 *     autofirmado). Los móviles/tablets del centro acceden por la WiFi.
 *     El HTTPS es necesario para que la cámara del navegador escanee.
 *
 * Se elige con la variable EDUMIND_MODE = local | red
 */
import { createServer as createHttp } from 'node:http';
import { createServer as createHttps } from 'node:https';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { networkInterfaces } from 'node:os';
import selfsigned from 'selfsigned';

const MODE = (process.env.EDUMIND_MODE ?? 'local').toLowerCase();
const isRed = MODE === 'red';
const PORT = Number(process.env.PORT ?? 4600);

function lanIp() {
	const nets = networkInterfaces();
	for (const name of Object.keys(nets)) {
		for (const net of nets[name] ?? []) {
			if (net.family === 'IPv4' && !net.internal) return net.address;
		}
	}
	return '127.0.0.1';
}

const HOST = isRed ? '0.0.0.0' : '127.0.0.1';
const ip = isRed ? lanIp() : '127.0.0.1';
const scheme = isRed ? 'https' : 'http';

// El handler de SvelteKit lee estas variables al importarse.
process.env.HOST = HOST;
process.env.PORT = String(PORT);
process.env.ORIGIN = process.env.ORIGIN ?? `${scheme}://${ip}:${PORT}`;

/** Genera (o reutiliza) un certificado autofirmado para el modo red. */
function ensureCert(ipAddr) {
	// db.ts (importado con el handler) fija EDUMIND_DATA_DIR a la zona de datos.
	const dir = resolve(process.env.EDUMIND_DATA_DIR ?? 'data', 'cert');
	mkdirSync(dir, { recursive: true });
	const keyP = resolve(dir, 'key.pem');
	const certP = resolve(dir, 'cert.pem');
	const ipMarker = resolve(dir, 'ip.txt');

	// Reutiliza si existe y la IP no ha cambiado.
	if (existsSync(keyP) && existsSync(certP) && existsSync(ipMarker)) {
		if (readFileSync(ipMarker, 'utf8').trim() === ipAddr) {
			return { key: readFileSync(keyP), cert: readFileSync(certP) };
		}
	}

	const pems = selfsigned.generate([{ name: 'commonName', value: ipAddr }], {
		days: 3650,
		keySize: 2048,
		algorithm: 'sha256',
		extensions: [
			{
				name: 'subjectAltName',
				altNames: [
					{ type: 2, value: 'localhost' },
					{ type: 7, ip: ipAddr },
					{ type: 7, ip: '127.0.0.1' }
				]
			}
		]
	});
	writeFileSync(keyP, pems.private);
	writeFileSync(certP, pems.cert);
	writeFileSync(ipMarker, ipAddr);
	return { key: pems.private, cert: pems.cert };
}

const { handler } = await import('../build/handler.js');

const server = isRed
	? createHttps(ensureCert(ip), handler)
	: createHttp(handler);

server.listen(PORT, HOST, () => {
	// Deja la URL de acceso para que el lanzador abra la correcta (local o red).
	try {
		writeFileSync(resolve(process.env.EDUMIND_DATA_DIR ?? 'data', 'url.txt'), process.env.ORIGIN);
	} catch {
		/* no crítico */
	}

	const line = '─'.repeat(52);
	console.log('\n' + line);
	if (isRed) {
		console.log('  Inventario EDUmind — MODO RED (compartido en el centro)');
		console.log(line);
		console.log(`  En este ordenador:  ${scheme}://localhost:${PORT}`);
		console.log(`  Para móviles/PC:    ${scheme}://${ip}:${PORT}`);
		console.log('');
		console.log('  · Conecta los móviles a la MISMA WiFi del centro.');
		console.log('  · La 1ª vez el navegador avisará del certificado:');
		console.log('    pulsa "Avanzado" → "Continuar". Es normal y seguro');
		console.log('    en la red local.');
	} else {
		console.log('  Inventario EDUmind — MODO LOCAL (solo este equipo)');
		console.log(line);
		console.log(`  Abre:  ${scheme}://127.0.0.1:${PORT}`);
	}
	console.log(line + '\n');
});

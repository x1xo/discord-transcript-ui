#!/usr/bin/env node
/**
 * Zero-dependency static server for local previewing.
 *
 *   node build/serve.mjs [--port 8080] [--root .]
 *
 * Useful for checking the demo over http:// instead of file://, which is closer
 * to how a transcript is actually served (and exercises real caching + CORS).
 */

import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const portArg = process.argv.indexOf('--port');
const port = portArg === -1 ? 8080 : Number(process.argv[portArg + 1]);

const TYPES = {
	'.html': 'text/html; charset=utf-8',
	'.css': 'text/css; charset=utf-8',
	'.js': 'text/javascript; charset=utf-8',
	'.mjs': 'text/javascript; charset=utf-8',
	'.json': 'application/json; charset=utf-8',
	'.png': 'image/png',
	'.svg': 'image/svg+xml',
	'.wav': 'audio/wav',
	'.mp3': 'audio/mpeg',
	'.mp4': 'video/mp4'
};

createServer(async (request, response) => {
	const path = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
	const target = join(root, normalize(path).replace(/^(\.\.[/\\])+/, ''));
	const file = target.endsWith('/') ? join(target, 'index.html') : target;

	try {
		const info = await stat(file);
		if (!info.isFile()) throw new Error('not a file');
		response.writeHead(200, {
			'content-type': TYPES[extname(file)] || 'application/octet-stream',
			'content-length': info.size,
			'cache-control': 'no-cache'
		});
		createReadStream(file).pipe(response);
	} catch {
		response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
		response.end('404\n');
	}
}).listen(port, '127.0.0.1', () => {
	console.log(`serving ${root} at http://127.0.0.1:${port}/demo/`);
});

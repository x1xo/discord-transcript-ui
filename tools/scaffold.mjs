#!/usr/bin/env node
/**
 * Turn an HTML fragment into a finished, CDN-loaded transcript.
 *
 *   node tools/scaffold.mjs --body examples/messages.html --out examples/sample-transcript.html \
 *        [--title "general — 2024-03-15"] [--config config.js] [--banner "Server name"]
 *
 * The generated file contains:
 *   * the asset recovery comment (URLs, sha256, SRI, mirrors) from dist/manifest.json;
 *   * an optional config script (window.$discordMessage);
 *   * the multi-mirror bootstrap from assets/cdn-loader.html;
 *   * the body fragment, untouched.
 *
 * Nothing here runs at view time — this is the generator your parser will use.
 */

import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');

function arg(name, fallback = null) {
	const index = process.argv.indexOf(`--${name}`);
	return index === -1 ? fallback : process.argv[index + 1];
}

const bodyPath = arg('body');
const outPath = arg('out');
if (!bodyPath || !outPath) {
	console.error('usage: node tools/scaffold.mjs --body <fragment.html> --out <transcript.html> [--title ...] [--config <file.js>]');
	process.exit(1);
}

const local = process.argv.includes('--local');

const manifest = JSON.parse(await readFile(join(root, 'dist', 'manifest.json'), 'utf8'));
const loaderTemplate = await readFile(join(root, 'assets', 'cdn-loader.html'), 'utf8');
const fragment = await readFile(resolve(bodyPath), 'utf8');
const config = arg('config') ? await readFile(resolve(arg('config')), 'utf8') : null;

/** npm-backed mirrors serve identical bytes and CORS, so they can carry SRI. */
const SRI_CAPABLE = new Set(['jsdelivr', 'unpkg', 'esm.run', 'esm.sh']);

function sources(extension) {
	// --local writes a preview that loads the freshly built files from ../dist,
	// so the generated file can be opened before anything is published.
	if (local) {
		const file = extension === 'css' ? 'discord-transcript.min.css' : 'discord-transcript.min.js';
		return [{ u: `../dist/${file}`, s: null }];
	}
	const integrity = manifest.integrity[extension];
	return Object.entries(manifest.urls[extension]).map(([id, url]) => ({
		u: url,
		s: SRI_CAPABLE.has(id) ? integrity : null
	}));
}

const loader = loaderTemplate
	.replace('%%CSS_SOURCES%%', JSON.stringify(sources('css'), null, '\t\t'))
	.replace('%%JS_SOURCES%%', JSON.stringify(sources('js'), null, '\t\t'));

const title = arg('title', 'Discord transcript');

/** Indent every non-empty line, leaving blank lines truly blank. */
function indent(text, tabs) {
	const pad = '\t'.repeat(tabs);
	return text
		.split('\n')
		.map((line) => (line.trim() ? pad + line : ''))
		.join('\n');
}

const html = `<!doctype html>
<html lang="en">
	<head>
		<meta charset="utf-8" />
		<meta name="viewport" content="width=device-width, initial-scale=1" />
		<meta name="color-scheme" content="dark light" />
		<title>${title.replace(/[<>&]/g, '')}</title>

${indent(manifest.recovery, 2)}

${config ? `\t\t<script>\n${indent(config.trim(), 3)}\n\t\t</script>\n` : ''}${indent(loader.trim(), 2)}
	</head>
	<body>
		<div class="dt-page">
			<div class="dt-page__inner">
${indent(fragment.trim(), 4)}
			</div>
		</div>
	</body>
</html>
`;

await writeFile(resolve(outPath), html);
console.log(`✓ wrote ${outPath}`);
console.log(`  ${manifest.name} v${manifest.version} · ${Object.keys(manifest.urls.css).length} CSS mirrors · ${Object.keys(manifest.urls.js).length} JS mirrors`);

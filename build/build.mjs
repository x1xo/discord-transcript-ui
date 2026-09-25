#!/usr/bin/env node
/**
 * Build pipeline for discord-transcript-ui.
 *
 * Produces, from the two hand-written source files:
 *   dist/discord-transcript.css        unminified, for debugging
 *   dist/discord-transcript.js         unminified, for debugging
 *   dist/discord-transcript.min.css    minified, served from the CDN
 *   dist/discord-transcript.min.js     minified, served from the CDN
 *   dist/v<version>/*                  byte-identical copies for tag-based hosts
 *   dist/manifest.json                 sizes, sha256, SRI, and the full URL matrix
 *   dist/recovery-comment.txt          the comment to stamp into generated HTML
 *
 * Usage: node build/build.mjs [--check]
 *   --check  fail if dist/ does not match the current sources (for CI)
 *
 * The published artifacts have no runtime dependencies; esbuild is only used
 * here, at build time, to minify.
 */

import { createHash } from 'node:crypto';
import { brotliCompressSync, gzipSync } from 'node:zlib';
import { mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const dist = join(root, 'dist');
const checkOnly = process.argv.includes('--check');

const config = JSON.parse(await readFile(join(root, 'lib.config.json'), 'utf8'));
const pkg = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'));
const version = config.version;

if (pkg.version !== version) {
	console.error(`✗ package.json version (${pkg.version}) != lib.config.json version (${version})`);
	process.exit(1);
}

const bannerCss = `/*! ${config.name} v${version} | MIT | https://github.com/${config.repository.org}/${config.repository.repo} */\n`;
const bannerJs = `/*! ${config.name} v${version} | MIT | https://github.com/${config.repository.org}/${config.repository.repo} */\n`;

async function minify(kind, code) {
	try {
		const esbuild = await import('esbuild');
		if (kind === 'css') {
			const result = await esbuild.transform(code, { loader: 'css', minify: true, legalComments: 'none' });
			return result.code;
		}
		const result = await esbuild.transform(code, {
			loader: 'js',
			minify: true,
			legalComments: 'none',
			target: ['es2019'],
			charset: 'utf8'
		});
		return result.code;
	} catch (error) {
		if (error && error.code === 'ERR_MODULE_NOT_FOUND') {
			console.error('✗ esbuild is not installed. Run: npm install');
			process.exit(1);
		}
		throw error;
	}
}

function sri(buffer) {
	return `sha384-${createHash('sha384').update(buffer).digest('base64')}`;
}

function sha256(buffer) {
	return createHash('sha256').update(buffer).digest('hex');
}

function expand(url) {
	return url
		.replaceAll('{name}', config.name)
		.replaceAll('{version}', version)
		.replaceAll('{org}', config.repository.org)
		.replaceAll('{repo}', config.repository.repo);
}

const cssSource = await readFile(join(root, 'src', 'discord-transcript.css'), 'utf8');
const jsSource = await readFile(join(root, 'src', 'discord-transcript.js'), 'utf8');

const minCss = bannerCss + (await minify('css', cssSource)).trim() + '\n';
const minJs = bannerJs + (await minify('js', jsSource)).trim() + '\n';

const artifacts = [
	{ name: 'discord-transcript.css', content: cssSource, minified: false },
	{ name: 'discord-transcript.min.css', content: minCss, minified: true },
	{ name: 'discord-transcript.js', content: jsSource, minified: false },
	{ name: 'discord-transcript.min.js', content: minJs, minified: true }
];

const manifest = {
	name: config.name,
	version,
	builtFrom: ['src/discord-transcript.css', 'src/discord-transcript.js'],
	license: 'MIT',
	artifacts: {},
	urls: {},
	integrity: {}
};

const targets = [
	{ key: 'cdnPrimary', file: 'discord-transcript.min.css', extension: 'css' },
	{ key: 'cdnPrimaryJs', file: 'discord-transcript.min.js', extension: 'js' }
];

for (const artifact of artifacts) {
	const buffer = Buffer.from(artifact.content, 'utf8');
	manifest.artifacts[artifact.name] = {
		bytes: buffer.byteLength,
		gzip: gzipSync(buffer, { level: 9 }).byteLength,
		brotli: brotliCompressSync(buffer).byteLength,
		sha256: sha256(buffer),
		sri: sri(buffer)
	};
}

for (const target of targets) {
	manifest.urls[target.extension] = {};
	manifest.integrity[target.extension] = manifest.artifacts[target.file].sri;
	for (const entry of config.cdn) {
		manifest.urls[target.extension][entry.id] = expand(entry.base) + target.file;
	}
}

manifest.archivalMirrors = config.archivalMirrors.map((mirror) => ({
	id: mirror.id,
	note: mirror.note,
	url: mirror.url
		.replaceAll('{version}', version)
		.replaceAll('{primaryCdnCssUrl}', manifest.urls.css[config.cdn[0].id])
		.replaceAll('{org}', config.repository.org)
		.replaceAll('{repo}', config.repository.repo)
}));

const cssStat = manifest.artifacts['discord-transcript.min.css'];
const jsStat = manifest.artifacts['discord-transcript.min.js'];

const recovery = `<!--
  discord-transcript-ui v${version} — asset recovery information.

  Keep this comment when you hand a transcript to someone else: it is enough to
  rebuild a working view even if this project is gone.

  Stylesheet : ${manifest.urls.css.jsdelivr}
               sha256-${cssStat.sha256}
               integrity="${cssStat.sri}"
  Script     : ${manifest.urls.js.jsdelivr}
               sha256-${jsStat.sha256}
               integrity="${jsStat.sri}"

  Mirrors (same bytes, drop-in):
${Object.entries(manifest.urls.css)
	.map(([id, url]) => `    ${id.padEnd(14)} ${url}`)
	.join('\n')}

  Manifest   : https://cdn.jsdelivr.net/npm/${config.name}@${version}/dist/manifest.json
  Source     : https://github.com/${config.repository.org}/${config.repository.repo}/tree/v${version}
  Licence    : MIT
  Sizes      : CSS ${cssStat.bytes}B raw / ${cssStat.gzip}B gzip · JS ${jsStat.bytes}B raw / ${jsStat.gzip}B gzip
-->`;

manifest.recovery = recovery;

const serialized = JSON.stringify(manifest, null, '\t') + '\n';

if (checkOnly) {
	const problems = [];
	for (const artifact of artifacts) {
		const path = join(dist, artifact.name);
		const current = existsSync(path) ? await readFile(path, 'utf8') : null;
		if (current !== artifact.content) problems.push(artifact.name);
	}
	const manifestPath = join(dist, 'manifest.json');
	const currentManifest = existsSync(manifestPath) ? await readFile(manifestPath, 'utf8') : null;
	if (currentManifest !== serialized) problems.push('manifest.json');

	if (problems.length) {
		console.error(`✗ dist/ is out of date: ${problems.join(', ')}`);
		console.error('  run: npm run build');
		process.exit(1);
	}
	console.log('✓ dist/ matches src/');
	process.exit(0);
}

await rm(dist, { recursive: true, force: true });
await mkdir(join(dist, `v${version}`), { recursive: true });
for (const artifact of artifacts) {
	await writeFile(join(dist, artifact.name), artifact.content);
	await writeFile(join(dist, `v${version}`, artifact.name), artifact.content);
}
await writeFile(join(dist, 'recovery-comment.txt'), recovery + '\n');
await writeFile(join(dist, 'manifest.json'), serialized);

console.log(`✓ built ${config.name} v${version}`);
console.log(`  css  ${cssStat.bytes}B raw · ${cssStat.gzip}B gzip · ${cssStat.brotli}B brotli`);
console.log(`  js   ${jsStat.bytes}B raw · ${jsStat.gzip}B gzip · ${jsStat.brotli}B brotli`);
console.log('  dist/manifest.json, dist/recovery-comment.txt');

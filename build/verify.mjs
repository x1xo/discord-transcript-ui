#!/usr/bin/env node
/**
 * Headless verification for discord-transcript-ui.
 *
 * Drives the locally installed Chrome over the DevTools Protocol and asserts on
 * real computed styles and layout — not on screenshots. Two pages are checked:
 *
 *   demo/index.html   full enhancement path (script loaded, config applied)
 *   demo/no-js.html   degradation path (stylesheet only, no script at all)
 *
 * Usage: node build/verify.mjs [--url <file-or-http-url>]
 * Requires: a Chrome/Chromium binary (CHROME env var, or google-chrome on PATH).
 */

import { execFileSync, spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const CHROME_CANDIDATES = [
	process.env.CHROME,
	'google-chrome',
	'google-chrome-stable',
	'chromium',
	'chromium-browser',
	'/usr/bin/google-chrome'
].filter(Boolean);

function resolveChrome() {
	for (const candidate of CHROME_CANDIDATES) {
		if (candidate.includes('/')) {
			if (existsSync(candidate)) return candidate;
			continue;
		}
		return candidate;
	}
	throw new Error('no Chrome binary found; set CHROME=/path/to/chrome');
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

class Session {
	constructor(socket) {
		this.socket = socket;
		this.id = 0;
		this.pending = new Map();
		this.errors = [];
		socket.addEventListener('message', (event) => {
			const message = JSON.parse(event.data);
			if (message.id && this.pending.has(message.id)) {
				const { resolve, reject } = this.pending.get(message.id);
				this.pending.delete(message.id);
				if (message.error) reject(new Error(message.error.message));
				else resolve(message.result);
				return;
			}
			if (message.method === 'Runtime.exceptionThrown') {
				const details = message.params.exceptionDetails;
				this.errors.push(details.exception?.description || details.text);
			}
			if (message.method === 'Runtime.consoleAPICalled' && message.params.type === 'error') {
				this.errors.push(message.params.args.map((arg) => arg.value ?? arg.description).join(' '));
			}
			if (message.method === 'Log.entryAdded' && message.params.entry.level === 'error') {
				this.errors.push(message.params.entry.text);
			}
		});
	}

	static async connect(url) {
		const socket = new WebSocket(url);
		await new Promise((resolve, reject) => {
			socket.addEventListener('open', resolve, { once: true });
			socket.addEventListener('error', () => reject(new Error(`cannot connect to ${url}`)), { once: true });
		});
		return new Session(socket);
	}

	send(method, params = {}) {
		const id = ++this.id;
		return new Promise((resolve, reject) => {
			this.pending.set(id, { resolve, reject });
			this.socket.send(JSON.stringify({ id, method, params }));
		});
	}

	async evaluate(expression) {
		const result = await this.send('Runtime.evaluate', {
			expression,
			returnByValue: true,
			awaitPromise: true
		});
		if (result.exceptionDetails) {
			throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
		}
		return result.result.value;
	}
}

async function launchChrome() {
	const child = spawn(
		resolveChrome(),
		[
			'--headless=new',
			'--disable-gpu',
			'--no-sandbox',
			'--hide-scrollbars',
			'--disable-dev-shm-usage',
			'--window-size=1000,1200',
			'--remote-debugging-port=0',
			'about:blank'
		],
		{ stdio: ['ignore', 'ignore', 'pipe'] }
	);

	const browserSocket = await new Promise((resolve, reject) => {
		let buffer = '';
		const timer = setTimeout(() => reject(new Error('timed out waiting for the DevTools socket')), 20000);
		child.stderr.on('data', (chunk) => {
			buffer += chunk;
			const match = buffer.match(/DevTools listening on (ws:\/\/\S+)/);
			if (match) {
				clearTimeout(timer);
				resolve(match[1]);
			}
		});
		child.on('exit', (code) => reject(new Error(`Chrome exited early (code ${code})`)));
	});

	const port = new URL(browserSocket).port;
	for (let attempt = 0; attempt < 60; attempt++) {
		const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
		const page = targets.find((target) => target.type === 'page');
		if (page) return { child, wsUrl: page.webSocketDebuggerUrl };
		await sleep(100);
	}
	throw new Error('no page target appeared');
}

async function openPage(session, url) {
	await session.send('Page.enable');
	await session.send('Runtime.enable');
	await session.send('Log.enable');
	await session.send('Page.navigate', { url });
	for (let attempt = 0; attempt < 80; attempt++) {
		try {
			const state = await session.evaluate('document.readyState');
			if (state === 'complete') break;
		} catch {
			/* navigation in flight */
		}
		await sleep(75);
	}
	await sleep(700);
}

function report(suite, checks) {
	let failed = 0;
	console.log(`\n${suite}`);
	for (const check of checks) {
		if (check.pass) {
			console.log(`  ✓ ${check.name}`);
		} else {
			failed++;
			console.log(`  ✗ ${check.name}\n      expected ${check.expected}, got ${check.actual}`);
		}
	}
	return failed;
}

const fullPageSuite = `(() => {
	const checks = [];
	const check = (name, actual, expected) =>
		checks.push({ name, actual: String(actual), expected: String(expected), pass: String(actual) === String(expected) });
	const near = (name, actual, expected, tolerance = 0.75) =>
		checks.push({
			name,
			actual: String(actual),
			expected: '~' + expected,
			pass: Math.abs(parseFloat(actual) - expected) <= tolerance
		});
	const style = (node, property, pseudo) =>
		node ? getComputedStyle(node, pseudo || null).getPropertyValue(property) : '<missing>';
	const all = (selector) => Array.from(document.querySelectorAll(selector));
	// Transitions interpolate computed values; make them instant for assertions.
	document.documentElement.style.setProperty('--dt-transition', '0s');
	const byAuthor = (name) => all('discord-message').find((m) => (m.querySelector('.dt-author') || {}).textContent === name);

	check('every message upgraded', all('discord-message[data-dt-r], discord-message[data-dt-ready]').length, all('discord-message').length);
	check('message count', all('discord-message').length, 16);
	check('auto-grouped continuations', all('discord-message[data-dt-continuation]').length, 3);
	check('replies upgraded', all('discord-reply[data-dt-r], discord-reply[data-dt-ready]').length, 2);
	check('reactions upgraded', all('discord-reaction[data-dt-r], discord-reaction[data-dt-ready]').length, 3);
	check('spoiler upgraded', all('discord-spoiler[data-dt-r], discord-spoiler[data-dt-ready]').length, 1);
	check('media spoiler overlay built', all('.dt-spoiler-overlay').length, 1);
	check('file attachment built', all('.dt-file-name').length, 1);
	check('audio element built', all('discord-audio-attachment audio').length, 1);
	check('thread CTA rendered', style(all('discord-thread')[0], 'content', '::after').includes('See thread'), true);

	check('dark transcript background', style(document.querySelector('#cozy discord-messages'), 'background-color'), 'rgb(50, 51, 57)');
	check('dark transcript font', style(document.querySelector('#cozy discord-messages'), 'font-family').includes('gg sans'), true);
	near('cozy avatar size', style(all('.dt-avatar')[0], 'width'), 40, 0.5);
	near('content starts at the 72px text column', all('#cozy discord-message')[2].querySelector('.dt-content').getBoundingClientRect().left - all('#cozy discord-message')[2].getBoundingClientRect().left, 72, 1);
	check('message right padding', style(all('#cozy discord-message')[2], 'padding-right'), '48px');
	check('role colour applied', style(byAuthor('Piton').querySelector('.dt-author'), 'color'), 'rgb(87, 242, 135)');
	const appBadge = byAuthor('Miona').querySelector('.dt-badge--verified');
	const appBox = appBadge.getBoundingClientRect();
	check('verified badge reads APP', appBadge.textContent, 'APP');
	check('verified badge draws a checkmark', style(appBadge, 'content', '::before'), '"\u2713"');
	check('verified badge is a rounded rectangle, not a circle', appBox.width > appBox.height, true);
	check('verified badge background is blurple', style(appBadge, 'background-color'), 'rgb(88, 101, 242)');
	check('verified badge is slightly rounded', style(appBadge, 'border-top-left-radius'), '4px');
	const plainBotTag = document.querySelector('#compact discord-message[author="Sable"] .dt-badge');
	check('unverified bot tag reads APP', plainBotTag.textContent, 'APP');
	check('unverified bot tag has no checkmark', style(plainBotTag, 'content', '::before').includes('\u2713'), false);
	check('unverified bot tag is not the verified variant', plainBotTag.classList.contains('dt-badge--verified'), false);
	// Anything older than yesterday reads as the short date and time Discord
	// uses, not the old zero-padded four-digit-year form. The clock time is
	// local, so only the shape is asserted here.
	check('timestamp formatted', /\\d{1,2}\\/\\d{1,2}\\/\\d{2}, \\d{1,2}:\\d{2} [AP]M/.test(byAuthor('Miona').querySelector('.dt-timestamp').textContent), true);
	check('timestamp tooltip present', byAuthor('Miona').querySelector('.dt-timestamp').title.length > 0, true);
	check('initials fallback for avatar-less author', all('.dt-avatar--initials').length, 5);

	const continuation = all('#cozy discord-message[data-dt-continuation]')[0];
	check('continuation hides avatar', style(continuation.querySelector('.dt-avatar'), 'visibility'), 'hidden');
	check('continuation hides header', style(continuation.querySelector('.dt-header'), 'display'), 'none');

	// Reply layout: Discord puts the reply preview above the author row.
	const replyMessage = all('discord-message').find((m) => m.querySelector('discord-reply'));
	const replyNode = replyMessage.querySelector('discord-reply');
	const replyAvatar = replyMessage.querySelector('.dt-avatar');
	const replyHeader = replyMessage.querySelector('.dt-header');
	check('reply renders above the author row', replyNode.getBoundingClientRect().top < replyHeader.getBoundingClientRect().top, true);
	check('avatar is level with the author name', Math.abs(replyAvatar.getBoundingClientRect().top - replyHeader.getBoundingClientRect().top) < 8, true);
	check('reply is lifted out of the message body', replyNode.closest('.dt-body'), null);
	check('reply is a direct child of the message grid', replyNode.parentElement.classList.contains('dt-msg'), true);

	// An image-source emoji must become an <img>, never a span full of URI text.
	const dataReaction = all('discord-reaction').find((r) => (r.getAttribute('emoji') || '').startsWith('data:'));
	check('data-URI emoji rendered as an image', dataReaction.querySelector('img') !== null, true);
	check('no reaction leaks a long text node', all('discord-reaction').every((r) => r.textContent.length < 20), true);

	check('user mention prefix', style(all('discord-mention')[0], 'content', '::before'), '"@"');
	check('channel mention prefix', style(all('discord-mention[type="channel"]')[0], 'content', '::before'), '"#"');
	check('role mention uses its colour', style(all('discord-mention[type="role"]')[0], 'color'), 'rgb(87, 242, 135)');

	const reaction = all('discord-reaction')[0];
	near('reaction pill height', style(reaction, 'height'), 24, 0.5);
	check('reacted pill border', style(all('discord-reaction[reacted]')[0], 'border-top-color'), 'rgb(88, 101, 242)');
	check('single reaction hides its count', all('discord-reaction')[2].querySelector('.dt-reaction-count'), null);
	check('reaction count from attribute', all('discord-reaction')[1].querySelector('.dt-reaction-count').textContent, '12');

	const spoiler = all('discord-spoiler')[0];
	const hidden = style(spoiler, 'background-color');
	spoiler.click();
	check('spoiler reveals on click', hidden !== style(spoiler, 'background-color'), true);

	const embed = all('discord-embed')[0];
	check('embed accent width', style(embed, 'border-left-width'), '4px');
	check('embed accent colour', style(embed, 'border-left-color'), 'rgb(88, 101, 242)');
	check('embed title from attribute', all('.dt-embed-title')[0].textContent, 'Everything renders from attributes');
	near('embed thumbnail width', embed.querySelector('.dt-embed-thumbnail').getBoundingClientRect().width, 80, 1);
	check('embed author row built', all('.dt-embed-author').length >= 1, true);
	check('field title via ::before', style(all('discord-embed-field')[0], 'content', '::before').includes('Inline one'), true);
	check('footer text rendered', all('discord-embed-footer')[0].textContent.includes('Footer text'), true);

	const fields = all('#cozy discord-embed-field[inline]');
	near('two inline fields share a row', fields[0].getBoundingClientRect().top, fields[1].getBoundingClientRect().top, 1.5);
	check('inline field is narrower than the embed', fields[0].getBoundingClientRect().width < embed.getBoundingClientRect().width * 0.5, true);

	// The thumbnail is pinned to the corner and the footer has to clear it on its
	// own full-width row; neither may overlap the other.
	const embedThumb = embed.querySelector('.dt-embed-thumbnail').getBoundingClientRect();
	const embedFooter = embed.querySelector('discord-embed-footer').getBoundingClientRect();
	check('embed footer clears the thumbnail', embedFooter.top >= embedThumb.bottom - 1, true);
	check('embed footer spans the row below', embedFooter.width > embedThumb.width * 1.5, true);
	check('embed thumbnail sits in the top-right corner', embedThumb.top - embed.getBoundingClientRect().top < 20 && embedThumb.right > embedFooter.right - 1, true);

	check('reaction click increments', (() => {
		const r = all('discord-reaction')[0];
		const before = r.querySelector('.dt-reaction-count').textContent;
		r.click();
		return r.querySelector('.dt-reaction-count').textContent !== before;
	})(), true);

	check('code copy button', all('.dt-copy').length, 1);
	check('jumbo detection ran', typeof all('.dt-jumbo').length, 'number');

	const compactAvatar = document.querySelector('#compact .dt-avatar');
	near('compact avatar size', style(compactAvatar, 'width'), 16, 0.5);
	check('compact header inline', style(document.querySelector('#compact .dt-header'), 'display'), 'inline');
	check('compact transcript background', style(document.querySelector('#compact discord-messages'), 'background-color'), 'rgb(50, 51, 57)');

	const light = document.querySelector('#light discord-messages');
	check('light transcript background', style(light, 'background-color'), 'rgb(255, 255, 255)');
	check('light token inheritance', style(document.querySelector('#light discord-message'), 'color'), 'rgb(46, 46, 52)');
	check('light embed background', style(document.querySelector('#light discord-embed'), 'background-color'), 'rgb(255, 255, 255)');
	// Discord's decimal colour attribute only becomes a CSS colour once the
	// script normalises it on to --dt-embed-color.
	check('decimal embed colour normalised', style(document.querySelector('#light discord-embed'), 'border-left-color'), 'rgb(255, 215, 0)');
	check('decimal colour left the attribute alone', document.querySelector('#light discord-embed').getAttribute('color'), '16766720');

	check('no horizontal overflow', document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1, true);
	return checks;
})()`;

const noScriptSuite = `(() => {
	const checks = [];
	const check = (name, actual, expected) =>
		checks.push({ name, actual: String(actual), expected: String(expected), pass: String(actual) === String(expected) });
	const style = (node, property, pseudo) =>
		node ? getComputedStyle(node, pseudo || null).getPropertyValue(property) : '<missing>';
	const all = (selector) => Array.from(document.querySelectorAll(selector));

	check('script never ran', all('.dt-msg').length + all('.dt-avatar').length, 0);
	check('message text still present', document.body.textContent.includes('Plain message text stays readable'), true);
	check('author name from attr(author)', style(all('discord-message')[0], 'content', '::before').includes('Piton'), true);
	check('user mention prefix', style(all('discord-mention')[0], 'content', '::before'), '"@"');
	check('channel mention prefix', style(all('discord-mention[type="channel"]')[0], 'content', '::before'), '"#"');
	check('reply author from attr', style(all('discord-reply')[0], 'content', '::before').includes('Piton'), true);
	check('embed title from attribute', style(all('discord-embed')[0], 'content', '::before').includes('Attribute-rendered embed title'), true);
	check('embed description is markup', all('discord-embed-description').length, 2);
	check('field title from attribute', style(all('discord-embed-field')[0], 'content', '::before').includes('Field'), true);
	check('file card rendered from attributes', style(all('discord-file-attachment')[0], 'content', '::after').includes('transcript.html'), true);
	check('reaction emoji from attribute', style(all('discord-reaction')[0], 'content', '::before'), '"🎉"');
	check('reaction count from attribute', style(all('discord-reaction')[0], 'content', '::after'), '"3"');
	const dataReactionNoJs = all('discord-reaction').find((r) => (r.getAttribute('emoji') || '').startsWith('data:'));
	check('data-URI emoji is not printed as text without the script', style(dataReactionNoJs, 'content', '::before'), 'none');
	check('data-URI pill text stays empty without the script', dataReactionNoJs.textContent.length, 0);
	check('single reaction hides count', style(all('discord-reaction')[1], 'content', '::after'), 'none');
	check('real image markup survives', all('discord-image-attachment img').length, 1);
	check('system message icon colour', style(all('discord-system-message')[0], 'background-color', '::before'), 'rgb(61, 158, 96)');
	check('durable embed markup styled', style(all('.dt-embed-title')[0], 'font-size'), '16px');
	check('no horizontal overflow', document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1, true);
	return checks;
})()`;


const bootstrapSuite = `(() => {
	const checks = [];
	const check = (name, actual, expected) =>
		checks.push({ name, actual: String(actual), expected: String(expected), pass: String(actual) === String(expected) });
	const style = (node, property) => (node ? getComputedStyle(node).getPropertyValue(property) : '<missing>');

	check('bootstrap injected the stylesheet', document.querySelectorAll('link[href*="discord-transcript"]').length, 1);
	check('bootstrap injected the script', document.querySelectorAll('script[src*="discord-transcript"]').length, 1);
	check('stylesheet took effect', style(document.querySelector('discord-messages'), 'background-color'), 'rgb(50, 51, 57)');
	check('script upgraded every message', document.querySelectorAll('discord-message[data-dt-r], discord-message[data-dt-ready]').length, document.querySelectorAll('discord-message').length);
	check('messages present', document.querySelectorAll('discord-message').length, 8);
	check('recovery comment kept', document.documentElement.outerHTML.includes('asset recovery information'), true);
	check('config applied from before the bootstrap', document.querySelector('.dt-author').textContent, 'Piton');
	check('no horizontal overflow', document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1, true);
	return checks;
})()`;

async function main() {
	const custom = process.argv.indexOf('--url');
	const target = custom === -1 ? null : process.argv[custom + 1];

	const { child, wsUrl } = await launchChrome();
	let failures = 0;
	try {
		const session = await Session.connect(wsUrl);

		await openPage(session, target || pathToFileURL(join(root, 'demo', 'index.html')).href);
		failures += report('demo/index.html — enhanced', await session.evaluate(fullPageSuite));

		await openPage(session, pathToFileURL(join(root, 'demo', 'no-js.html')).href);
		failures += report('demo/no-js.html — stylesheet only', await session.evaluate(noScriptSuite));

		// Regenerate the local-preview transcript first, so the bootstrap path is
		// always exercised against the artifacts that were just built.
		const localPreview = join(root, 'examples', 'local-preview.html');
		execFileSync(
			process.execPath,
			[
				join(root, 'tools', 'scaffold.mjs'),
				'--body',
				join(root, 'examples', 'messages.html'),
				'--config',
				join(root, 'examples', 'config.js'),
				'--out',
				localPreview,
				'--local',
				'--title',
				'local preview'
			],
			{ stdio: 'ignore' }
		);
		await openPage(session, pathToFileURL(localPreview).href);
		failures += report('examples/local-preview.html — CDN bootstrap', await session.evaluate(bootstrapSuite));

		if (session.errors.length) {
			failures += session.errors.length;
			console.log('\nconsole errors');
			for (const error of session.errors) console.log(`  ✗ ${error}`);
		}
	} finally {
		child.kill('SIGKILL');
	}

	console.log(failures === 0 ? '\n✓ all checks passed\n' : `\n✗ ${failures} check(s) failed\n`);
	process.exit(failures === 0 ? 0 : 1);
}

await main();

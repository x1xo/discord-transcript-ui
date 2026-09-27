/**
 * The compact tag vocabulary.
 *
 * The default markup uses readable names (`<discord-message>`). A renderer that
 * wants the smallest possible file can emit short codes instead, and link the
 * short-name stylesheet this build produces. Both vocabularies are supported by
 * the stylesheet (as two files, so nobody pays for the one they do not use) and
 * by the enhancement script, which matches either.
 *
 * Keep this table in sync with the Go renderer:
 * discord-transcript-go/transcript/tags.go
 *
 * A test asserts every long name here maps to a distinct short code.
 */

export const SHORT_TAGS = {
	'discord-messages': 'dms',
	'discord-guild-header': 'dgh',
	'discord-message': 'dm',
	'discord-attachments': 'dats',
	'discord-image-attachment': 'dimg',
	'discord-video-attachment': 'dvid',
	'discord-audio-attachment': 'daud',
	'discord-file-attachment': 'dfil',
	'discord-reactions': 'drs',
	'discord-reaction': 'dr',
	'discord-embed': 'de',
	'discord-embed-description': 'ded',
	'discord-embed-fields': 'defs',
	'discord-embed-field': 'def',
	'discord-embed-footer': 'defo',
	'discord-mention': 'dme',
	'discord-custom-emoji': 'demo',
	'discord-time': 'dti',
	'discord-spoiler': 'dsp',
	'discord-bold': 'db',
	'discord-italic': 'di',
	'discord-underlined': 'dun',
	'discord-strikethrough': 'dst',
	'discord-subscript': 'dsub',
	'discord-code': 'dc',
	'discord-pre': 'dp',
	'discord-quote': 'dq',
	'discord-list-item': 'dli',
	'discord-unordered-list': 'dul',
	'discord-ordered-list': 'dol',
	'discord-header': 'dh',
	'discord-system-message': 'dsy',
	'discord-thread': 'dth',
	'discord-thread-message': 'dthm',
	'discord-link': 'dl',
	// Names the stylesheet also supports for hand-written or third-party markup.
	'discord-reply': 'drp',
	'discord-action-row': 'dar',
	'discord-button': 'dbtn',
	'discord-command': 'dcmd',
	'discord-author-info': 'dai',
	'discord-verified-author-tag': 'dvat'
};

/** Escapes a literal for use inside a RegExp. */
function escapeRegExp(value) {
	return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Rewrites every tag name in a stylesheet to its short code.
 *
 * Tag names only ever appear in selectors (verified: no declaration in the
 * source stylesheet contains "discord-"), and the lookarounds make sure a
 * prefix like `discord-embed` never matches inside `discord-embed-field`.
 *
 * @param {string} css stylesheet text, minified or not
 * @returns {string}
 */
export function toShortCSS(css) {
	let out = css;
	for (const [long, short] of Object.entries(SHORT_TAGS)) {
		const pattern = new RegExp(`(?<![\\w-])${escapeRegExp(long)}(?![\\w-])`, 'g');
		out = out.replace(pattern, short);
	}
	return out;
}

/**
 * Long tag names that survived a rewrite, ignoring the package name in the
 * banner comment. Used by the build as a guard: shipping a short stylesheet
 * with a long name still in it would silently unstyled that element.
 *
 * @param {string} css
 * @returns {string[]}
 */
export function unmappedTags(css) {
	const names = new Set();
	const pattern = /(?<![\w-])discord-[a-z][a-z-]*(?![\w-])/g;
	for (const match of css.matchAll(pattern)) {
		if (match[0] !== 'discord-transcript-ui') names.add(match[0]);
	}
	return [...names];
}

/**
 * Selector that matches a tag in either vocabulary, e.g. `:is(discord-message,dm)`.
 *
 * @param {string} name tag name without the `discord-` prefix
 * @returns {string}
 */
export function tagSelector(name) {
	const long = `discord-${name}`;
	const short = SHORT_TAGS[long];
	return short ? `:is(${long},${short})` : long;
}

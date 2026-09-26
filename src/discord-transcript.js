/*!
 * discord-transcript-ui v1.0.0 — enhancement layer
 * MIT licensed. No dependencies. Light DOM only.
 *
 * This file is optional: the stylesheet + static HTML already render a readable
 * transcript. The script only adds things CSS cannot express — avatars and author
 * headers from the profile map, formatted timestamps, spoiler/attachment
 * interaction, embed chrome built from attributes, and lazy media.
 *
 * Config (define it any time before DOMContentLoaded):
 *   window.$discordMessage = {
 *     profiles: { miona: { author: 'Miona', avatar: 'https://…', roleColor: '#ff0000', bot: true } },
 *     avatars:  { default: 'blue', blue: 'https://cdn.discordapp.com/embed/avatars/0.png' }
 *   };
 *   window.discordTranscript = { groupWindow: 7, locale: 'en-US', observe: true };
 */

(function () {
	'use strict';

	if (typeof window === 'undefined' || typeof document === 'undefined') return;
	if (window.DiscordTranscript && window.DiscordTranscript.version) return;

	var VERSION = '1.0.0';
	var GROUP_WINDOW_MS = 7 * 60 * 1000;

	var DEFAULT_AVATARS = {
		blue: 'https://cdn.discordapp.com/embed/avatars/0.png',
		gray: 'https://cdn.discordapp.com/embed/avatars/1.png',
		green: 'https://cdn.discordapp.com/embed/avatars/2.png',
		orange: 'https://cdn.discordapp.com/embed/avatars/3.png',
		red: 'https://cdn.discordapp.com/embed/avatars/4.png',
		pink: 'https://cdn.discordapp.com/embed/avatars/5.png'
	};

	/* Initial colours for authors with no avatar, so archived transcripts never
	   depend on a remote image to render a distinguishable gutter. */
	var INITIAL_COLORS = [
		'#5865f2',
		'#3ba55c',
		'#faa81a',
		'#ed4245',
		'#eb459e',
		'#00a8fc',
		'#9b59b6',
		'#1abc9c'
	];

	var relativeTimers = [];
	var relativeElements = [];

	/* Tag names come in two vocabularies: the readable discord-* default, and the
	   compact codes an opt-in renderer emits (see build/short-tags.mjs). Both are
	   matched, so this script works with either stylesheet. */
	var SHORT_TAGS = {
		messages: 'dms', message: 'dm', reply: 'drp', time: 'dti', spoiler: 'dsp',
		embed: 'de', 'embed-footer': 'defo', 'file-attachment': 'dfil',
		'image-attachment': 'dimg', 'video-attachment': 'dvid', 'audio-attachment': 'daud',
		reaction: 'dr', pre: 'dp', code: 'dc', 'custom-emoji': 'demo',
		'attachments': 'dats', thread: 'dth', 'author-info': 'dai'
	};

	function tag(name) {
		var short = SHORT_TAGS[name];
		return short ? ':is(discord-' + name + ',' + short + ')' : 'discord-' + name;
	}

	/* ---------------------------------------------------------------- config */

	function config() {
		return (window.$discordMessage = window.$discordMessage || {});
	}

	function options() {
		return (window.discordTranscript = window.discordTranscript || {});
	}

	function avatarMap() {
		var merged = {};
		var key;
		for (key in DEFAULT_AVATARS) merged[key] = DEFAULT_AVATARS[key];
		var custom = config().avatars || {};
		for (key in custom) if (custom[key]) merged[key] = custom[key];
		if (!merged.default || DEFAULT_AVATARS[merged.default]) {
			merged.default = merged[custom.default] || DEFAULT_AVATARS.blue;
		}
		return merged;
	}

	function resolveAvatar(value) {
		var avatars = avatarMap();
		if (value === undefined || value === null || value === '') return avatars.default;
		if (avatars[value]) return avatars[value];
		return value;
	}

	function profileFor(element) {
		var key = element.getAttribute('profile');
		var profiles = config().profiles || {};
		return (key && profiles[key]) || {};
	}

	function attrOr(element, attribute, fallback) {
		var value = element.getAttribute(attribute);
		return value === null || value === '' ? fallback : value;
	}

	/** Merge a profile entry with per-element attributes (attributes win). */
	function identity(element) {
		var profile = profileFor(element);
		var author = attrOr(element, 'author', profile.author || 'User');
		var avatar = element.getAttribute('avatar') || profile.avatar;
		return {
			author: author,
			avatarUrl: resolveAvatar(avatar),
			hasAvatar: Boolean(avatar),
			roleColor: element.getAttribute('role-color') || profile.roleColor || null,
			bot: has(element, 'bot') || Boolean(profile.bot),
			verified: has(element, 'verified') || Boolean(profile.verified),
			server: has(element, 'server') || Boolean(profile.server),
			official: has(element, 'official-app') || Boolean(profile.officialApp),
			op: has(element, 'op') || Boolean(profile.op)
		};
	}

	function has(element, attribute) {
		return element.hasAttribute(attribute);
	}

	function initialsColor(name) {
		var sum = 0;
		for (var i = 0; i < name.length; i++) sum = (sum + name.charCodeAt(i)) % 997;
		return INITIAL_COLORS[sum % INITIAL_COLORS.length];
	}

	/* ------------------------------------------------------------ timestamps */

	function parseStamp(value) {
		if (value === null || value === undefined || value === '') return null;
		if (/^\d+$/.test(value)) return new Date(Number(value));
		var date = new Date(value);
		return isNaN(date.getTime()) ? null : date;
	}

	function timeZone() {
		return options().timeZone || undefined;
	}

	function locale() {
		return options().locale || 'en-US';
	}

	function intl(formatOptions, date) {
		return new Intl.DateTimeFormat(locale(), Object.assign({ timeZone: timeZone() }, formatOptions)).format(date);
	}

	function hour12(use24) {
		return !(use24 || options().hour24);
	}

	function clockTime(date, use24) {
		return intl({ hour: 'numeric', minute: '2-digit', hour12: hour12(use24) }, date).replace(/\u202f/g, ' ');
	}

	/** The same time without the space before AM/PM, as message headers show it. */
	function compactTime(date, use24) {
		return clockTime(date, use24).replace(/\s+(AM|PM)$/i, '$1');
	}

	/** Discord's short date: 3/14/26 (locale-aware, no leading zeros). */
	function shortDate(date) {
		return intl({ year: '2-digit', month: 'numeric', day: 'numeric' }, date);
	}

	/** Short date and short time: 3/14/26, 11:57 AM. */
	function shortDateTime(date, use24) {
		return shortDate(date) + ', ' + clockTime(date, use24);
	}

	/** Discord message-header stamp: relative days for today/yesterday. */
	function headerStamp(date, use24) {
		var now = new Date();
		var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
		var day = new Date(date.getFullYear(), date.getMonth(), date.getDate());
		var diffDays = Math.round((today - day) / 86400000);
		if (diffDays === 0) return compactTime(date, use24);
		if (diffDays === 1) return 'Yesterday at ' + compactTime(date, use24);
		return shortDateTime(date, use24);
	}

	/** Discord's <t:…> format flags: t T d D f F R. */
	function formatStamp(date, flag, use24) {
		switch (flag) {
			case 't':
				return clockTime(date, use24);
			case 'T':
				return intl(
					{ hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: hour12(use24) },
					date
				).replace(/\u202f/g, ' ');
			case 'd':
				return shortDate(date);
			case 'D':
				return intl({ day: 'numeric', month: 'long', year: 'numeric' }, date);
			case 'F':
				return (
					intl({ weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }, date) +
					' at ' +
					clockTime(date, use24)
				);
			case 'R':
				return relativeStamp(date);
			case 's':
				return shortDateTime(date, use24);
			case 'S':
				return (
					shortDate(date) +
					', ' +
					intl({ hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: hour12(use24) }, date).replace(
						/\u202f/g,
						' '
					)
				);
			case 'f':
			default:
				return shortDateTime(date, use24);
		}
	}

	function relativeStamp(date) {
		var delta = Math.round((date.getTime() - Date.now()) / 1000);
		var future = delta > 0;
		var units = [
			['year', 31536000],
			['month', 2592000],
			['week', 604800],
			['day', 86400],
			['hour', 3600],
			['minute', 60],
			['second', 1]
		];
		for (var i = 0; i < units.length; i++) {
			var size = units[i][1];
			if (Math.abs(delta) >= size || size === 1) {
				var amount = Math.abs(Math.round(delta / size));
				var label = units[i][0] + (amount === 1 ? '' : 's');
				return future ? 'in ' + amount + ' ' + label : amount + ' ' + label + ' ago';
			}
		}
		return 'now';
	}

	/* ------------------------------------------------------------- factories */

	function make(tag, className, text) {
		var node = document.createElement(tag);
		if (className) node.className = className;
		if (text !== undefined) node.textContent = text;
		return node;
	}

	function avatarNode(identity, className) {
		var wrap = make('span', className || 'dt-avatar');
		if (identity.hasAvatar) {
			var img = make('img');
			img.src = identity.avatarUrl;
			img.alt = '';
			img.decoding = 'async';
			wrap.appendChild(img);
		} else {
			wrap.classList.add('dt-avatar--initials');
			wrap.style.backgroundColor = initialsColor(identity.author);
			wrap.textContent = (identity.author || '?').charAt(0);
		}
		return wrap;
	}

	function badgeRow(identity) {
		var row = make('span', 'dt-badges');
		/* Bots are tagged "APP"; verified bots additionally get the checkmark,
		   which is drawn by CSS (so the tag reads "✓ APP"). */
		if (identity.bot) {
			var botTag = identity.verified ? 'dt-badge dt-badge--verified' : 'dt-badge';
			row.appendChild(make('span', botTag, 'APP'));
		} else if (identity.server) {
			row.appendChild(make('span', 'dt-badge dt-badge--server', 'SERVER'));
		} else if (identity.official) {
			row.appendChild(make('span', 'dt-badge dt-badge--official', 'OFFICIAL'));
		}
		if (identity.op) row.appendChild(make('span', 'dt-badge', 'OP'));
		return row.children.length ? row : null;
	}

	/* --------------------------------------------------------- message upgrade */

	function upgradeMessage(element) {
		if (has(element, 'data-dt-ready')) return;

		var identity = identityOf(element);
		var stamp = parseStamp(element.getAttribute('timestamp'));
		var body = make('div', 'dt-body');
		var replies = [];

		/* Optional parser-supplied header escapes the generated one. */
		var suppliedHeader = element.querySelector(':scope > ' + tag('author-info') + ', :scope > discord-message-header');
		if (suppliedHeader) suppliedHeader.remove();

		/* Reply previews are lifted out of the body: Discord draws them above the
		   author row, with the avatar level with the author name. */
		while (element.firstChild) {
			var child = element.firstChild;
			if (child.nodeType === 1 && (child.tagName === 'DISCORD-REPLY' || child.tagName === 'DISCORD-COMMAND')) {
				replies.push(child);
				element.removeChild(child);
				continue;
			}
			body.appendChild(child);
		}

		var wrap = make('div', 'dt-msg');
		if (replies.length) {
			wrap.classList.add('dt-msg--has-reply');
			for (var replyIndex = 0; replyIndex < replies.length; replyIndex++) wrap.appendChild(replies[replyIndex]);
		}
		wrap.appendChild(avatarNode(identity, 'dt-avatar'));

		var content = make('div', 'dt-content');
		var header = make('div', 'dt-header');
		var author = make('span', 'dt-author', identity.author);
		if (identity.roleColor) author.style.color = identity.roleColor;
		header.appendChild(author);

		var badges = badgeRow(identity);
		if (badges) header.appendChild(badges);

		var use24 = has(element, 'twenty-four');
		if (stamp) {
			var time = make('span', 'dt-timestamp', headerStamp(stamp, use24));
			time.title = formatStamp(stamp, 'F', use24);
			header.appendChild(time);
			element.setAttribute('data-dt-short-time', clockTime(stamp, use24));
		}

		content.appendChild(header);
		content.appendChild(body);
		wrap.appendChild(content);
		element.appendChild(wrap);

		if (has(element, 'edited')) body.appendChild(make('span', 'dt-edited', '(edited)'));
		if (isJumbo(body)) body.classList.add('dt-jumbo');

		element.setAttribute('data-dt-ready', '');
	}

	function identityOf(element) {
		return identity(element);
	}

	function isJumbo(body) {
		var text = (body.textContent || '').replace(/\s+/g, '');
		if (text.length > 0) return false;
		var emoji = body.querySelectorAll(tag('custom-emoji') + ', img.emoji');
		return emoji.length > 0 && emoji.length <= 6;
	}

	/** Continuation grouping: same author, at most a `groupWindow` minute gap. */
	function applyGrouping(list) {
		if (options().grouping === false) return;
		var windowMs = (options().groupWindow || 7) * 60 * 1000;
		var previous = null;
		var previousStamp = null;

		for (var i = 0; i < list.length; i++) {
			var message = list[i];
			message.removeAttribute('data-dt-continuation');
			message.removeAttribute('data-dt-group-start');

			if (message.hasAttribute('message-body-only')) {
				message.setAttribute('data-dt-continuation', '');
				previous = null;
				previousStamp = null;
				continue;
			}

			var identityKey =
				message.getAttribute('profile') || message.getAttribute('author') || message.getAttribute('avatar');
			var stamp = parseStamp(message.getAttribute('timestamp'));
			var sameAuthor = previous !== null && identityKey !== null && identityKey === previous;
			var closeInTime = previousStamp === null || stamp === null || Math.abs(stamp - previousStamp) <= windowMs;

			if (sameAuthor && closeInTime) {
				message.setAttribute('data-dt-continuation', '');
			} else if (previous !== null) {
				message.setAttribute('data-dt-group-start', '');
			}

			previous = identityKey;
			previousStamp = stamp;
		}
	}

	/* ----------------------------------------------------------- sub-upgrades */

	function upgradeReply(element) {
		if (has(element, 'data-dt-ready') || has(element, 'deleted')) return;
		var identity = identityOf(element);
		var leading = [];

		if (!element.querySelector(':scope > .dt-reply-avatar')) {
			if (identity.hasAvatar) leading.push(avatarNode(identity, 'dt-reply-avatar'));
		}

		var author = make('span', 'dt-reply-author', (has(element, 'mentions') ? '@' : '') + identity.author);
		if (identity.roleColor) author.style.color = identity.roleColor;
		leading.push(author);

		var mentions = make('span', 'dt-sr-only', 'replying to ');
		element.insertBefore(mentions, element.firstChild);
		for (var i = leading.length - 1; i >= 0; i--) element.insertBefore(leading[i], mentions.nextSibling);

		element.setAttribute('data-dt-ready', '');
	}

	function upgradeTime(element) {
		if (has(element, 'data-dt-ready')) return;
		var raw = element.getAttribute('timestamp');
		if (!raw) return;
		var date = parseStamp(raw === 'now' ? String(Date.now()) : raw);
		if (!date) return;
		var use24 = has(element, 'twenty-four');
		var flag = element.getAttribute('format') || 'f';
		element.setAttribute('data-dt-stamp', date.toISOString());
		element.textContent = formatStamp(date, flag, use24);
		element.setAttribute('datetime', date.toISOString());
		element.title = formatStamp(date, 'F', use24);
		element.setAttribute('data-dt-ready', '');
		if (flag === 'R' && relativeElements.indexOf(element) === -1) relativeElements.push(element);
	}

	function stampOf(element) {
		return parseStamp(element.getAttribute('data-dt-stamp') || element.getAttribute('timestamp'));
	}

	function refreshRelative() {
		for (var i = 0; i < relativeElements.length; i++) {
			var date = stampOf(relativeElements[i]);
			if (date) relativeElements[i].textContent = relativeStamp(date);
		}
	}

	function upgradeSpoilers(root) {
		var spoilers = root.querySelectorAll(tag('spoiler') + ':not([data-dt-ready])');
		for (var i = 0; i < spoilers.length; i++) {
			var spoiler = spoilers[i];
			spoiler.setAttribute('data-dt-ready', '');
			spoiler.setAttribute('role', 'button');
			if (!spoiler.hasAttribute('tabindex')) spoiler.setAttribute('tabindex', '0');
			spoiler.setAttribute('aria-expanded', has(spoiler, 'activated') ? 'true' : 'false');
		}

		var media = root.querySelectorAll(
			tag('image-attachment') + '[spoiler], ' + tag('video-attachment') + '[spoiler]'
		);
		for (var j = 0; j < media.length; j++) {
			if (media[j].querySelector(':scope > .dt-spoiler-overlay')) continue;
			media[j].appendChild(make('button', 'dt-spoiler-overlay', 'Spoiler'));
		}
	}

	function toggleSpoiler(element) {
		var open = !has(element, 'data-dt-revealed');
		if (open) element.setAttribute('data-dt-revealed', '');
		else element.removeAttribute('data-dt-revealed');
		if (element.hasAttribute('aria-expanded')) element.setAttribute('aria-expanded', open ? 'true' : 'false');
	}

	/* Discord stores an embed colour as a decimal integer (`16766720`), which CSS
	   cannot read from an attribute. Anything already in CSS form — a hex string,
	   an rgb()/hsl() call, a keyword — is handed back untouched, so a renderer can
	   use whichever form it has. */
	function normaliseColor(value) {
		var text = String(value).trim();
		if (!text) return text;
		if (/^[0-9]+$/.test(text)) {
			var decimal = parseInt(text, 10);
			if (!isFinite(decimal) || decimal < 0 || decimal > 0xffffff) return text;
			return '#' + ('000000' + decimal.toString(16)).slice(-6);
		}
		if (/^#?[0-9a-f]{3}$/i.test(text) || /^#?[0-9a-f]{6}$/i.test(text)) {
			return text.charAt(0) === '#' ? text : '#' + text;
		}
		return text;
	}

	function upgradeReactions(element) {
		if (has(element, 'data-dt-ready')) return;
		var emoji = element.getAttribute('emoji');
		/* Any of these is an image source rather than a unicode character. Data
		   URIs matter: inline SVG/PNG emoji must never be emitted as visible text. */
		var isImage = emoji && /^(https?:|data:|blob:|\/|\.\/)/i.test(emoji);
		if (isImage) {
			var img = make('img', 'dt-reaction-emoji');
			img.src = emoji;
			img.alt = element.getAttribute('name') || '';
			img.loading = 'lazy';
			img.decoding = 'async';
			element.appendChild(img);
		} else if (emoji) {
			element.appendChild(make('span', 'dt-reaction-emoji', emoji));
		}
		var count = parseInt(element.getAttribute('count') || '1', 10);
		if (count > 1) element.appendChild(make('span', 'dt-reaction-count', String(count)));
		element.setAttribute('data-dt-ready', '');
	}

	function reactionCount(element) {
		var node = element.querySelector(':scope > .dt-reaction-count');
		return node ? parseInt(node.textContent, 10) || 1 : 1;
	}

	function setReactionCount(element, value) {
		var node = element.querySelector(':scope > .dt-reaction-count');
		if (value <= 1) {
			if (node) node.remove();
			return;
		}
		if (!node) element.appendChild(make('span', 'dt-reaction-count', String(value)));
		else node.textContent = String(value);
	}

	function upgradeEmbed(element) {
		if (has(element, 'data-dt-ready')) return;
		var color = element.getAttribute('color');
		if (color) element.style.setProperty('--dt-embed-color', normaliseColor(color));

		var content = element.querySelector(':scope > .dt-embed-content');
		if (!content) {
			content = make('div', 'dt-embed-content');
			while (element.firstChild) content.appendChild(element.firstChild);
			element.appendChild(content);
		}

		var provider = element.getAttribute('provider');
		if (provider && !content.querySelector(':scope > .dt-embed-provider')) {
			content.insertBefore(make('span', 'dt-embed-provider', provider), content.firstChild);
		}

		var authorName = element.getAttribute('author-name');
		if (authorName && !content.querySelector(':scope > .dt-embed-author')) {
			var authorRow = make('div', 'dt-embed-author');
			var authorImage = element.getAttribute('author-image');
			if (authorImage) {
				var icon = make('img');
				icon.src = authorImage;
				icon.alt = '';
				icon.loading = 'lazy';
				icon.decoding = 'async';
				authorRow.appendChild(icon);
			}
			var authorUrl = element.getAttribute('author-url');
			if (authorUrl) {
				var link = make('a', null, authorName);
				link.href = authorUrl;
				link.target = '_blank';
				link.rel = 'noopener noreferrer';
				authorRow.appendChild(link);
			} else {
				authorRow.appendChild(make('span', null, authorName));
			}
			content.insertBefore(authorRow, content.firstChild);
		}

		var title = element.getAttribute('embed-title') || element.getAttribute('title');
		if (title && !content.querySelector(':scope > .dt-embed-title')) {
			var url = element.getAttribute('url');
			var titleNode = url ? make('a', 'dt-embed-title dt-embed-title--link', title) : make('span', 'dt-embed-title', title);
			if (url) {
				titleNode.href = url;
				titleNode.target = '_blank';
				titleNode.rel = 'noopener noreferrer';
			}
			var afterAuthor = content.querySelector(':scope > .dt-embed-author, :scope > .dt-embed-provider');
			if (afterAuthor) afterAuthor.insertAdjacentElement('afterend', titleNode);
			else content.insertBefore(titleNode, content.firstChild);
		}

		var thumbnail = element.getAttribute('thumbnail');
		if (thumbnail && !element.querySelector(':scope > .dt-embed-thumbnail')) {
			var thumb = make('div', 'dt-embed-thumbnail');
			var thumbImg = make('img');
			thumbImg.src = thumbnail;
			thumbImg.alt = '';
			thumbImg.loading = 'lazy';
			thumbImg.decoding = 'async';
			thumb.appendChild(thumbImg);
			element.appendChild(thumb);
		}

		var video = element.getAttribute('video');
		var image = element.getAttribute('image');
		if ((video || image) && !element.querySelector(':scope > .dt-embed-image')) {
			var media = make('div', 'dt-embed-image');
			if (video) {
				var videoNode = make('video');
				videoNode.controls = true;
				videoNode.preload = 'metadata';
				videoNode.src = video;
				media.appendChild(videoNode);
			} else {
				var img = make('img');
				img.src = image;
				img.alt = '';
				img.loading = 'lazy';
				img.decoding = 'async';
				media.appendChild(img);
			}
			var footer = content.querySelector(':scope > ' + tag('embed-footer'));
			content.insertBefore(media, footer || null);
		}

		element.setAttribute('data-dt-ready', '');
	}

	function upgradeImage(element) {
		if (has(element, 'data-dt-ready')) return;
		var url = element.getAttribute('url');
		if (url && !element.querySelector('img')) {
			var img = make('img');
			img.src = url;
			img.alt = element.getAttribute('alt') || 'discord image attachment';
			img.loading = 'lazy';
			img.decoding = 'async';
			var width = element.getAttribute('width');
			var height = element.getAttribute('height');
			if (width) img.style.maxWidth = width + 'px';
			if (height) img.style.maxHeight = height + 'px';
			element.appendChild(img);
		}
		var nested = element.querySelector('img');
		if (nested && !nested.getAttribute('loading')) nested.loading = 'lazy';
		element.setAttribute('data-dt-ready', '');
	}

	function upgradeMedia(element, tag) {
		if (has(element, 'data-dt-ready')) return;
		var href = element.getAttribute('href') || element.getAttribute('src');
		if (href && !element.querySelector(tag)) {
			var node = make(tag);
			node.controls = true;
			node.preload = 'metadata';
			node.src = href;
			if (tag === 'video') {
				node.playsInline = true;
				var poster = element.getAttribute('poster');
				if (poster) node.poster = poster;
			}
			element.appendChild(node);
		}
		element.setAttribute('data-dt-ready', '');
	}

	function upgradeFile(element) {
		if (has(element, 'data-dt-ready')) return;
		var href = element.getAttribute('href');
		if (href && !element.firstChild) {
			var link = make('a');
			link.href = href;
			link.target = element.getAttribute('target') || '_blank';
			link.rel = 'noopener noreferrer';
			var name = element.getAttribute('name') || href.split('/').pop() || 'file';
			link.appendChild(make('span', 'dt-file-icon', element.getAttribute('type') || 'FILE'));
			var meta = make('span', 'dt-file-meta');
			meta.appendChild(make('span', 'dt-file-name', name));
			meta.appendChild(
				make(
					'span',
					'dt-file-size',
					[element.getAttribute('bytes'), element.getAttribute('bytes-unit')].filter(Boolean).join(' ')
				)
			);
			link.appendChild(meta);
			element.appendChild(link);
		}
		element.setAttribute('data-dt-ready', '');
	}

	function upgradeCode(element) {
		if (has(element, 'data-dt-ready') || element.querySelector(':scope > .dt-copy')) return;
		var button = make('button', 'dt-copy', 'Copy');
		button.type = 'button';
		element.appendChild(button);
		element.setAttribute('data-dt-ready', '');
	}

	function lazyImages(root) {
		var images = root.querySelectorAll(
			tag('attachments') + ' img:not([loading]), ' + tag('embed') + ' img:not([loading]), ' + tag('embed') + ' video, ' + tag('thread') + ' img'
		);
		for (var i = 0; i < images.length; i++) images[i].setAttribute('loading', 'lazy');
	}

	/* ------------------------------------------------------------- traversal */

	function upgrade(root) {
		if (!root || !root.querySelectorAll) return;

		var messages = root.querySelectorAll(tag('message') + ':not([data-dt-ready])');
		for (var i = 0; i < messages.length; i++) upgradeMessage(messages[i]);

		var lists = root.querySelectorAll(tag('messages'));
		for (var j = 0; j < lists.length; j++) {
			var grouped = lists[j].querySelectorAll(':scope > ' + tag('message'));
			if (grouped.length) applyGrouping(grouped);
		}

		var replies = root.querySelectorAll(tag('reply') + ':not([data-dt-ready])');
		for (var k = 0; k < replies.length; k++) upgradeReply(replies[k]);

		var times = root.querySelectorAll(tag('time') + ':not([data-dt-ready])');
		for (var m = 0; m < times.length; m++) upgradeTime(times[m]);

		var embeds = root.querySelectorAll(tag('embed') + ':not([data-dt-ready])');
		for (var n = 0; n < embeds.length; n++) upgradeEmbed(embeds[n]);

		var files = root.querySelectorAll(tag('file-attachment') + ':not([data-dt-ready])');
		for (var o = 0; o < files.length; o++) upgradeFile(files[o]);

		var images = root.querySelectorAll(tag('image-attachment') + ':not([data-dt-ready])');
		for (var p = 0; p < images.length; p++) upgradeImage(images[p]);

		var videos = root.querySelectorAll(tag('video-attachment') + ':not([data-dt-ready])');
		for (var q = 0; q < videos.length; q++) upgradeMedia(videos[q], 'video');

		var audios = root.querySelectorAll(tag('audio-attachment') + ':not([data-dt-ready])');
		for (var r = 0; r < audios.length; r++) upgradeMedia(audios[r], 'audio');

		var reactions = root.querySelectorAll(tag('reaction') + ':not([data-dt-ready])');
		for (var s = 0; s < reactions.length; s++) upgradeReactions(reactions[s]);

		var codes = root.querySelectorAll(tag('pre') + ':not([data-dt-ready])');
		for (var t = 0; t < codes.length; t++) upgradeCode(codes[t]);

		upgradeSpoilers(root);
		lazyImages(root);
		applyThemeFallbacks(root);
	}

	/** `light-theme` on the container mirrors to data-theme for the CSS tokens. */
	function applyThemeFallbacks(root) {
		var lists = root.querySelectorAll(tag('messages'));
		for (var i = 0; i < lists.length; i++) {
			if (lists[i].hasAttribute('light-theme') && !lists[i].hasAttribute('data-theme')) {
				lists[i].setAttribute('data-theme', 'light');
			}
		}
	}

	/* ---------------------------------------------------------------- events */

	function onClick(event) {
		var target = event.target;
		if (!target || !target.closest) return;

		var spoiler = target.closest('discord-spoiler');
		if (spoiler) {
			toggleSpoiler(spoiler);
			return;
		}

		var overlay = target.closest('.dt-spoiler-overlay');
		if (overlay && overlay.parentElement) {
			overlay.parentElement.setAttribute('data-dt-revealed', '');
			return;
		}

		var reaction = target.closest('discord-reaction');
		if (reaction && reaction.hasAttribute('data-dt-ready')) {
			var count = reactionCount(reaction);
			if (has(reaction, 'reacted')) {
				reaction.removeAttribute('reacted');
				setReactionCount(reaction, Math.max(1, count - 1));
			} else {
				reaction.setAttribute('reacted', '');
				setReactionCount(reaction, count + 1);
			}
			return;
		}

		var copy = target.closest('.dt-copy');
		if (copy && copy.parentElement && navigator.clipboard) {
			var pre = copy.parentElement;
			var text = pre.querySelector(tag('code') + ', pre, code');
			navigator.clipboard.writeText((text || pre).textContent).then(function () {
				copy.textContent = 'Copied';
				setTimeout(function () {
					copy.textContent = 'Copy';
				}, 1200);
			});
		}
	}

	function onKeydown(event) {
		if (event.key !== 'Enter' && event.key !== ' ') return;
		var target = event.target;
		if (!target || !target.closest) return;
		var spoiler = target.closest('discord-spoiler');
		if (spoiler) {
			event.preventDefault();
			toggleSpoiler(spoiler);
		}
	}

	/* ------------------------------------------------------------------ boot */

	var pending = null;

	function schedule(root) {
		if (pending) return;
		pending = window.requestAnimationFrame(function () {
			pending = null;
			upgrade(root || document);
		});
	}

	function boot() {
		upgrade(document);
		document.addEventListener('click', onClick, false);
		document.addEventListener('keydown', onKeydown, false);

		if (window.setInterval) {
			relativeTimers.push(
				window.setInterval(function () {
					if (relativeElements.length) refreshRelative();
				}, 60000)
			);
		}

		if (options().observe !== false && window.MutationObserver) {
			var observer = new MutationObserver(function (records) {
				for (var i = 0; i < records.length; i++) {
					if (records[i].addedNodes.length) {
						schedule(document);
						return;
					}
				}
			});
			observer.observe(document.documentElement, { childList: true, subtree: true });
		}
	}

	if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, false);
	else boot();

	window.DiscordTranscript = {
		version: VERSION,
		upgrade: function (root) {
			upgrade(root || document);
		},
		refresh: refreshRelative,
		formatStamp: formatStamp,
		parseStamp: parseStamp
	};
})();

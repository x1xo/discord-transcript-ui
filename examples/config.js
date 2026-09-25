/**
 * Author metadata for a transcript, defined once and shared by every message.
 *
 * This file is inlined into the generated HTML by tools/scaffold.mjs and must
 * appear BEFORE the CDN bootstrap, because the enhancement script reads it when
 * it runs. Key names are the values used by <discord-message profile="…">.
 */
window.$discordMessage = {
	avatars: {
		default: 'blue',
		blue: 'https://cdn.discordapp.com/embed/avatars/0.png',
		green: 'https://cdn.discordapp.com/embed/avatars/2.png',
		red: 'https://cdn.discordapp.com/embed/avatars/4.png'
	},
	profiles: {
		piton: {
			author: 'Piton',
			avatar: 'https://cdn.discordapp.com/embed/avatars/2.png',
			roleColor: '#57f287'
		},
		kestrel: {
			author: 'Kestrel'
		},
		miona: {
			author: 'Miona',
			avatar: 'https://cdn.discordapp.com/embed/avatars/4.png',
			roleColor: '#eb459e',
			bot: true,
			verified: true
		},
		ravik: {
			author: 'Ravik',
			avatar: 'https://cdn.discordapp.com/embed/avatars/0.png',
			roleColor: '#5865f2',
			bot: true,
			verified: true
		}
	}
};

/** Optional: grouping window in minutes, locale, time zone, observer toggle. */
window.discordTranscript = { groupWindow: 7, locale: 'en-US', observe: true };

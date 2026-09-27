# discord-transcript-ui — markup contract

**Contract version 1.0.0.** This is the document your Discord-layout parser should be
built against. It is the only thing that has to stay stable: the stylesheet and script
may change internally, but these elements, attributes and rules will not break inside
1.x.

Everything is plain **light DOM**: custom element names are just tags, styled by
`src/discord-transcript.css`. There is no Shadow DOM, no framework and no build step
for consumers.

---

## 1. Include the assets

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/discord-transcript-ui@1.0.1/dist/discord-transcript.min.css" />
<script src="https://cdn.jsdelivr.net/npm/discord-transcript-ui@1.0.1/dist/discord-transcript.min.js" defer></script>
```

For real transcripts use the multi-mirror bootstrap in `assets/cdn-loader.html`
(generated for you by `tools/scaffold.mjs`) — see `docs/CDN-STRATEGY.md`.

## 2. Author metadata: the profile map

Avatars, bot flags and role colours are declared once instead of on every message.
The script reads this when it runs, so the config **must appear before the assets**
(any inline `<script>` in `<head>` works).

```html
<script>
	window.$discordMessage = {
		avatars: { default: 'blue', blue: 'https://cdn.discordapp.com/embed/avatars/0.png' },
		profiles: {
			miona: { author: 'Miona', avatar: '…', roleColor: '#5865f2', bot: true, verified: true }
		}
	};
	window.discordTranscript = { groupWindow: 7, locale: 'en-US', observe: true };
</script>
```

`profile="miona"` on an element pulls all of it in. Per-element attributes always win
over the profile entry. `avatar` accepts a key from `avatars`, a full URL, or nothing
(then `avatars.default` is used; if that is unreachable the script draws a coloured
initial, so a transcript never depends on a remote image to be readable).

| Option (`window.discordTranscript`) | Default | Meaning |
| --- | --- | --- |
| `groupWindow` | `7` | Minutes within which a second message from the same author is a continuation row. |
| `grouping` | `true` | Set `false` to disable continuation detection entirely. |
| `locale` | `'en-US'` | Locale for all timestamp formatting. |
| `timeZone` | viewer's | IANA zone for timestamp formatting. |
| `hour24` | `false` | Force 24-hour clocks everywhere. |
| `observe` | `true` | Watch for lazily added messages and upgrade them too. |

---

## 3. Containers

### `<discord-messages>`

Required wrapper. Attributes:

| Attribute | Type | Meaning |
| --- | --- | --- |
| `channel-name` | string | Renders a channel header above the messages. |
| `channel-type` | `text` \| `voice` \| `thread` \| `forum` \| `locked` | Chooses the `#` prefix on that header. |
| `compact-mode` | boolean | 16px avatars, inline header, one row per message. |
| `light-theme` | boolean | Light theme for everything inside. Equivalent to `data-theme="light"`. |
| `no-background` | boolean | Transparent background, for embedding in a page you style yourself. |

Only direct `<discord-message>` children participate in continuation grouping.

### `<discord-message>`

| Attribute | Type | Meaning |
| --- | --- | --- |
| `profile` | string | Key into the profile map. |
| `author` | string | Display name (overrides the profile). |
| `avatar` | string | Avatar key or URL (overrides the profile). |
| `role-color` | hex | Name colour. |
| `bot`, `verified`, `server`, `official-app`, `op` | boolean | Name badges. A bot renders Discord's `APP` tag (a slightly rounded blurple rectangle); `verified` adds the checkmark, so it reads `✓ APP`. `server`, `official-app` and `op` render `SERVER`, `OFFICIAL` and `OP`. |
| `timestamp` | ISO-8601 or epoch ms | Header timestamp. |
| `twenty-four` | boolean | 24-hour clock for this message. |
| `edited` | boolean | Adds `(edited)`. |
| `highlight`, `ephemeral`, `mentioned` | boolean | Row background + 2px accent bar. |
| `message-body-only` | boolean | Force a continuation row (no avatar, no header). |

Children are free-form and rendered in document order: text, inline formatting, then any
of `<discord-reply>`, `<discord-embed>`, `<discord-attachments>`, `<discord-reactions>`,
`<discord-thread>`, `<discord-action-row>`.

**Continuation grouping** is automatic: a message whose author (profile or `author`) matches
the previous message and is within `groupWindow` minutes renders without an avatar or header,
with the time shown in the gutter on hover. `message-body-only` forces it.

---

## 4. Inline content

| Element | Attributes | Notes |
| --- | --- | --- |
| `<discord-mention>` | `type` (`user`, `role`, `channel`, `voice`, `thread`, `forum`, `locked`, `everyone`, `here`), `color`, `no-prefix` | CSS inserts `@`/`#`; do not repeat it in the text. For a role colour use `<discord-mention type="role" style="--dt-mention-role-color: #57f287">` (the legacy skyra variable `--discord-mention-color` is also honoured). |
| `<discord-custom-emoji>` | `name`, `url`, `jumbo` | `name` is the fallback text when no image is available. |
| `<discord-time>` | `timestamp`, `format`, `twenty-four` | `format` is Discord's flag set: `t T d D f F R s S` (§7). Put a readable fallback in the text content — it is what a script-less viewer sees. |
| `<discord-spoiler>` | (none needed) | Hidden by default; click/Enter/Space reveals. `activated` marks it pre-revealed. |
| `<discord-bold>`, `<discord-italic>`, `<discord-underlined>`, `<discord-strikethrough>` | — | Inline formatting. |
| `<discord-subscript>` | — | Discord's `-# small print` subtext: a block-level line in the subtle grey (`.875rem`, `--dt-text-subtle`), not a subscript. |
| `<discord-link>` | `href`, `target`, `rel` | A plain `<a>` inside a message is styled too. |
| `<discord-code>` | `multiline`, `embed` | Inline by default, block with `multiline`. |
| `<discord-pre>` | `embed` | Block code container; wrap the code in `<discord-code>` or a plain `<code>`/`<pre>`. The script adds a copy button. |
| `<discord-quote>` | — | Blockquote with the 4px spine. |
| `<discord-unordered-list>` / `<discord-ordered-list>` | `start` (ordered) | Wrappers for `<discord-list-item>` children. |
| `<discord-header>` | `level` (`1`–`3`) | Markdown heading. |

## 5. Replies

`<discord-reply>` is a **child of the message it replies to** (document order puts it above
the message text, exactly like Discord).

| Attribute | Meaning |
| --- | --- |
| `profile` / `author` / `avatar` / `role-color` / `bot` / `verified` / `mentions` | Same as the message, plus `mentions` which prefixes `@`. |
| `command`, `attachment`, `edited` | Trailing indicator flags. |
| `deleted` | Renders "Original message was deleted" and ignores children. |

## 6. Embeds

`<discord-embed>` renders a 4px accent bar, a 1px border, a raised surface and the
standard grid. Attributes: `color`, `url`, `author-name`, `author-image`, `author-url`,
`embed-title`, `thumbnail`, `image`, `video`, `provider`.

Two ways to build one, and you can mix them:

**A. Attribute form** (compact HTML; the script fills in the chrome).
The title, author, thumbnail and media exist only after the script runs.

```html
<discord-embed color="#5865f2" embed-title="Title" author-name="Miona" thumbnail="…" image="…">
	<discord-embed-description>Text stays as markup.</discord-embed-description>
</discord-embed>
```

**B. Markup form** (durable: identical with or without the script).

```html
<discord-embed color="#5865f2">
	<span class="dt-embed-author"><img src="…" alt="" />Miona</span>
	<a class="dt-embed-title" href="…">Title</a>
	<discord-embed-description>Text stays as markup.</discord-embed-description>
	<div class="dt-embed-thumbnail"><img src="…" alt="" /></div>
	<div class="dt-embed-image"><img src="…" alt="" /></div>
</discord-embed>
```

Embed children:

| Element | Attributes | Notes |
| --- | --- | --- |
| `<discord-embed-description>` | — | Free-form body. |
| `<discord-embed-fields>` | — | Grid wrapper. |
| `<discord-embed-field>` | `field-title`, `inline`, `inline-index` (1–3) | Inline fields take 1/3 (1/2 when a thumbnail is present). |
| `<discord-embed-footer>` | `footer-image`, `footer-image-alt`, `timestamp` | Footer text is the element's content; `footer` is an attribute shortcut when empty. |

Public helper classes (part of the contract): `dt-embed-author`, `dt-embed-title`,
`dt-embed-thumbnail`, `dt-embed-image`, `dt-embed-provider`, `dt-embed-footer-icon`.

Renderers that keep skyra's markup can mark media with `slot` attributes instead
of the helper classes; the stylesheet lays those out too, with no script:

| Markup | Layout |
| --- | --- |
| `[slot='thumbnail']` (an `<img>` or a wrapper around one) | Pinned 80×80 to the embed's top-right. A generated spacer of the same size reserves that corner, so a description written as bare text wraps beside it rather than under it. |
| `[slot='image']` | Full-width block below the text. |
| `[slot='footer']` | Same as `<discord-embed-footer>`. |

Whatever the parser's child order, the thumbnail stays in the top-right corner and
`<discord-embed-fields>`, `[slot='image']` and the footer clear it, so the footer
always occupies its own full-width row below everything.

The accent colour resolves in this order: the `--dt-embed-color` custom property,
then a `color` attribute that is already a CSS colour (`#5865f2`), then the default
grey. Discord's decimal form (`color="16766720"`) only becomes a colour once the
script runs — it normalises decimals on to `--dt-embed-color`.

## 7. Attachments

`<discord-attachments>` is a single-column wrapper; children render in order.

| Element | Attributes | Durable form |
| --- | --- | --- |
| `<discord-image-attachment>` | `url`, `alt`, `width`, `height`, `spoiler` | Nest a real `<img>`; the script only adds lazy loading and the spoiler overlay. `width`/`height` become maximums. |
| `<discord-video-attachment>` | `href`, `poster`, `spoiler` | Nest a real `<video controls>`; the script can build it from `href`. |
| `<discord-audio-attachment>` | `href`, `name`, `bytes`, `bytes-unit` | Nest a real `<audio controls>`. |
| `<discord-file-attachment>` | `name`, `bytes`, `bytes-unit`, `type`, `href`, `target` | Rendered by CSS from the attributes even with no script and no children. The script upgrades it into a real link. |

Prefer nesting real media elements: images and video then render even if every CDN is
down, which matters for a 10-year-old archive.

## 7a. Inline media and the media pool

A renderer that inlines its media — the Go renderer does, because Discord's signed
URLs expire within hours — may store a repeated blob once instead of once per use.
This is a producer-side optimization: nothing in this stylesheet and nothing in the
script is needed for it, and the document stays self-contained.

* **One-off images stay images.** An attachment or an embed image that appears once
  is an ordinary `<img src="data:…">`, so `alt` text and printing keep working.
* **Repeated decorative media is hoisted.** An avatar, an embed author or footer
  icon, or a thumbnail that appears more than once becomes a reference:

  ```html
  <style data-dt-media-pool>
  	.dt-media{display:block;background-position:center;background-size:cover;background-repeat:no-repeat}
  	.dt-media-1{background-image:url("data:image/png;base64,…")}
  </style>
  …
  <span class="dt-avatar"
  	><span class="dt-media dt-media-1" role="img" aria-label="" style="width:100%;height:100%"></span
  ></span>
  ```

  The box comes from the element it replaces: an avatar or footer icon fills its
  parent, the embed author icon carries `24px`, a thumbnail fills its wrapper. Being
  a background rather than an `<img>` is the trade-off: a strict CSP then needs
  `style-src 'unsafe-inline'` (or a nonce) for the style block and `img-src data:`
  for the background.

Consumers that walk images should accept both forms — `img[src^="data:"]` and
`.dt-media`, whose blob lives in the pool's `<style>` — and neither needs the script
to render.

## 8. Reactions

```html
<discord-reactions>
	<discord-reaction emoji="🎉" count="3"></discord-reaction>
	<discord-reaction emoji="https://…/emoji.png" name=":party:" count="12" reacted></discord-reaction>
</discord-reactions>
```

`emoji` is a unicode character or an image URL; `count` defaults to 1 and is hidden when
it is 1; `reacted` highlights the pill; `interactive` lets a click change the count
(a presentation toy, not a real reaction API).

## 9. Buttons, system messages, threads, commands

| Element | Attributes |
| --- | --- |
| `<discord-action-row>` | — (wrap `<discord-button>` children) |
| `<discord-button>` | `type` (`primary`, `secondary`, `success`, `destructive`, `link`), `emoji`, `emoji-name`, `url`, `disabled`. Label is the element's text content. |
| `<discord-system-message>` | `type` (`join`, `leave`, `call`, `missed-call`, `boost`, `edit`, `thread`, `pin`, `alert`, `error`, `upgrade`), `timestamp`. The text is the element's content; the icon is drawn by CSS from `type`. |
| `<discord-thread>` | `name`, `cta` (`See thread`). Children are the preview messages. |
| `<discord-thread-message>` | `profile`/`author`/`avatar`/`role-color`/`bot`/`server`/`verified`/`edited`, `relative-timestamp`. |
| `<discord-command>` | `command`, `author`, `profile`, `type` (`slash_command`, `user_command`, `message_command`). Rendered as a reply-style line: "Author used /command". |
| `<discord-verified-author-tag>` | `verified` — inline "App"-style badge. |

## 10. What works without JavaScript

| Feature | CSS only | Needs the script |
| --- | --- | --- |
| Message text, formatting, quotes, lists, headers, links | yes | — |
| Author *name* (from `attr(author)`) | yes | styled header |
| Avatars, badges, role colour, continuation rows | no | yes (profile map) |
| Timestamps in headers | no | yes |
| `<discord-time>` | fallback text you provide | formatted/relative text |
| Mentions, spoilers (hover-peek), reactions, system messages, threads | yes | interaction |
| Embeds: description, fields, footer | yes | title/author/thumbnail/media from attributes |
| Attachments: nested `<img>`/`<video>`/`<audio>`, file cards | yes | lazy loading, spoiler overlay, attribute-only forms |
| Buttons | yes | emoji images, links |

Rule of thumb: **if it is content, put it in markup**; attributes are for chrome.

## 11. Theming

Override `--dt-*` custom properties on `:root`, on `<discord-messages>`, or on any element.
The full token list, with the live-Discord values and their sources, is in
`docs/DESIGN-TOKENS.md`. The most useful ones:

```css
discord-messages {
	--dt-bg-primary: #323339; /* chat background */
	--dt-text-normal: #f3f3f4;
	--dt-text-link: #76aff6;
	--dt-brand: #5865f2;
	--dt-avatar-size: 40px;
	--dt-gutter: 16px;
	--dt-msg-padding-right: 48px;
	--dt-font: 'gg sans', 'Noto Sans', Helvetica, Arial, sans-serif;
	--dt-radius-md: 8px;
}
```

Optional outer shell: wrap the transcript in `.dt-page > .dt-page__inner` for a full-page
background and sane typography. `.dt-page__title` / `.dt-page__meta` style a header.

## 12. Differences from `@skyra/discord-components-core`

The tag names are deliberately compatible so existing knowledge transfers, but this is not
a drop-in replacement — it is a light-DOM reimplementation:

* **No Shadow DOM and no `<slot>`.** Skyra's `slot="embeds"`, `slot="fields"`,
  `slot="footer"`, `slot="reply"` attributes are inert here; children are laid out by
  document order. They can be left in the markup harmlessly.
* **`discord-time` takes `timestamp`/`format`** (skyra's has no attributes at all).
* **`discord-spoiler` reveals on click** and accepts `activated`; hovering peeks when the
  script is absent.
* **Continuation rows are detected automatically** (skyra requires `compact-mode` /
  `message-body-only`).
* **`discord-command` renders as a static line**; skyra's `context-*` attributes are not
  implemented.
* **No modals, polls, select menus, invites or custom media players.** Attachments use
  native `<audio>`/`<video>` controls.
* **No `::part()`** (impossible in light DOM) — theme via `--dt-*` tokens instead.

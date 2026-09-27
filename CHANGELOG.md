# Changelog

## 1.1.5

* **A guild header above the conversation.** `<discord-guild-header>` is an
  optional first child of `<discord-messages>`: the server icon on the left, the
  guild name with the channel under it. The channel name is the one the transcript
  already had; it now sits below the guild instead of standing alone. When a guild
  header is present the `channel-name` fallback header on `<discord-messages>`
  stands down, so the channel is never named twice.
* The element renders from markup — icon, name and channel as real elements, with
  no script — and a guild with no icon keeps its place with a coloured initial,
  the same fallback an avatar uses. The script also accepts the attribute form
  (`guild-name`, `guild-icon`, and `channel-name`/`channel-type` inherited from the
  container), and the icon goes through the media pipeline like any avatar, so a
  repeated one is pooled.
* New public helper classes: `dt-guild-icon`, `dt-guild-icon--initials`,
  `dt-guild-meta`, `dt-guild-name`, `dt-guild-channel`; new short tag
  `discord-guild-header` → `dgh`.

## 1.1.4

* **An embed hugs its content.** `discord-embed` was a block box with only a
  `max-width`, so an embed holding one short line still stretched to the whole
  516px column and left a wide empty slab beside its text. It now sizes to its
  content and keeps the 516px cap only for text long enough to need it, which is
  the width Discord draws.
* **A link button is a real link.** The stylesheet positions a `<discord-button>`
  inside an `<a class="dt-button-link">`, the shape a renderer emits when a button
  has a URL: a light-DOM custom element cannot navigate on its own, so the anchor
  is what makes the button clickable without any script. The anchor adds no
  underline or colour of its own.
* **The script upgrades buttons it did not build.** It reads `emoji` (a unicode
  character, or an image URL for a custom emoji, with `emoji-name` as the alt) and
  wraps a `url` button in the same anchor, so hand-written markup renders the way
  the Go renderer's does. A button already marked `data-dt-r` is left alone.

## 1.1.3

* **A grouped line no longer reserves an avatar's height.** A continuation row
  keeps its avatar slot so the columns stay aligned, but the slot is now zero
  height — an invisible 32px box used to hold every consecutive message apart
  from the same author. Applies to `[data-dt-continuation]` and
  `[message-body-only]`.
* **The "this is already built" marker is shorter:** `data-dt-ready` became
  `data-dt-r`, four bytes less on every message, reply, embed, attachment and
  reaction. The stylesheet and the script read **both** names, so a transcript
  generated against 1.1.2 or earlier keeps rendering with this release; the
  script only ever writes the short one.

## 1.1.2

Fixes for embeds produced by renderers that use skyra-style markup — a bare
description, media marked with `slot` attributes — rather than the helper
classes:

* **The embed accent colour is applied.** The stylesheet reads
  `--dt-embed-color`, which only the script used to set, and the script skips
  embeds already marked `data-dt-ready` — so every embed from the Go renderer
  drew a default grey bar. The renderer now sets the property inline, and a
  `color` attribute that is already a CSS colour (`#5865f2`) is read straight
  off the element wherever typed `attr()` is available.
* **Media marked with `slot` attributes is positioned**, instead of flowing
  inline beside the footer. The thumbnail is pinned to the top-right corner
  whatever order the parser emits its children in, and a generated spacer of the
  same size makes the description wrap beside it; `[slot='image']` becomes a
  block below the text.
* **A bare description keeps its line breaks**, and the embed footer clears the
  thumbnail and always spans its own full-width row below everything.
* **Embed spacing**: an embed with no content wrapper used to hug its top border,
  because the leading 8px lived on the first child's margin and bare text has no
  element to carry it. That padding is now on the embed itself, and every block
  inside an embed keeps the same 8px rhythm, matching Discord.

## 1.1.1

* **Timestamps now read the way Discord shows them.** Message headers use the
  compact time without a space before AM/PM: `11:49PM` for today,
  `Yesterday at 11:49PM` for yesterday, and `3/14/26, 11:57 AM` before that.
  Every other stamp — inline `<t:…>` timestamps and embed footers — uses the
  short date and time, `3/14/26, 11:57 AM`.
* The `d`, `f`, `s` and `S` `<t:…>` flags switched from a zero-padded
  four-digit-year date (`03/14/2026`) to Discord's short form (`3/14/26`), and
  `F` now reads `Saturday, March 14, 2026 at 11:57 AM`.

## 1.1.0

## 1.1.0

* **Compact tag vocabulary, opt-in.** A second stylesheet,
  `dist/discord-transcript.short.min.css`, is the same rules with short element
  names (`dm`, `dme`, `dsp`, …) for renderers that want the smallest possible
  file. It is a straight rename, so it is the same size as the default one and
  nobody pays for a vocabulary they do not use. The mapping lives in
  `build/short-tags.mjs`, and the build fails if the short stylesheet would ship
  a long tag name it cannot style.
* **The enhancement script matches either vocabulary** (`:is(discord-message,dm)`
  and friends), so it works with both stylesheets.
* Measured on a text-heavy transcript: short names cut ~21% of the raw markup and
  ~5% of the gzipped markup. Repeated long names compress well, so the win is
  real only for uncompressed files.
* **`<discord-subscript>` is now the small-print line it claims to be**: `-# text`
  renders at `.875rem` in `var(--dt-text-subtle)` on its own line, matching
  Discord's live CSS for `<small>`. It previously used the legacy 13px size with
  `vertical-align: sub`, which both coloured it like body text and misaligned it.

## 1.0.1

## 1.0.1

First release: light-DOM `discord-*` custom elements, one stylesheet, one optional
enhancement script, a versioned build with a sha256/SRI manifest, a multi-mirror bootstrap
and a headless verification suite.

Everything below was found and fixed while reviewing the rendered gallery, before any
release, so it is all part of this first version.

* **Replies render above the author row.** A `<discord-reply>` is lifted out of the message
  body into the first grid row, so the avatar and the author name share the second row —
  Discord's layout. Previously the reply appeared under the name and the avatar aligned with
  the reply. (CSS + JS)
* **Image-source emoji are no longer printed as text.** Reaction emoji detection only
  recognised `http(s):`, `/` and `./`, so a `data:` URI emoji was emitted as a 16px span
  holding the whole URI, which wrapped into a column of stray characters. `data:` and
  `blob:` are now treated as images, the CSS-only fallback suppresses the text form for them
  too, and `.dt-reaction-emoji` clips overflow as a safety net. (CSS + JS)
* **Bot tags read `APP` instead of `BOT`.** A bot renders a slightly rounded blurple
  rectangle reading `APP`; a verified bot adds the checkmark, so it reads `✓ APP`. The
  checkmark is drawn in CSS while `APP` is real DOM text, so screen readers announce it, and
  the same treatment applies to `<discord-verified-author-tag>` and to
  `<discord-author-info bot>` / `<discord-author-info bot verified>` without the script.
  (CSS + JS)
* **Example authors renamed** to generated handles — `miona`, `piton`, `kestrel`, `ravik`
  and `sable` — replacing the names carried over from the upstream documentation.

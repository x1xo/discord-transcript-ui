# Changelog

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

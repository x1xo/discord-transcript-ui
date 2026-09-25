# Changelog

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

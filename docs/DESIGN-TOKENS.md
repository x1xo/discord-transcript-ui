# Discord Desktop/Web Chat UI — Design Token Reference

Compiled from Discord's **live production CSS** (not third‑party guesses), cross‑checked with established clones.

## How this was collected (so you can re‑verify)

| Source | What it gave |
|---|---|
| `https://discord.com/app` → `https://discord.com/assets/952007.2308d8f9bc028a51.css` (774 KB, **4,362 custom properties**, the theme/token chunk of the current client) | all colour + geometry tokens, `.theme-dark/.theme-darker/.theme-midnight/.theme-light`, `@font-face`, typography scale |
| Component chunks from the same bundle: `__623de` (embed + text-style/design-system), `__75297` (markup / blockquote / code / lists), `__299eb` (spoiler), `__ada32f` (inline code + hljs), `__f75fb0`/`__84017` (chat input, channel header) | exact component CSS |
| `:root` design-token blocks in the same file | `--space-*`, `--radius-*`, `--custom-message-*`, `--custom-*` |
| [edwin-shdw/discord.css](https://github.com/edwin-shdw/discord.css) (v0.4.0) | embed/mention geometry cross-check |
| [skyra-project/discord-components](https://github.com/skyra-project/discord-components) (`@skyra/discord-components-core@4.0.2`) | message/reply/reaction/system-message geometry (marked *third-party/legacy* where used) |
| [discord.js `Colors`](https://discord.js.org/docs/packages/discord.js/main/Colors%3AVariable) · [TimestampStyles](https://discord.js.org/docs/packages/formatters/0.6.0/TimestampStyles:Variable) | role colour names, timestamp flags |
| [Discord API docs reference](https://docs.discord.com/developers/reference#message-formatting-timestamp-styles) | timestamp flag table |
| [Engadget, 2025‑03‑25](https://www.engadget.com/gaming/pc/discords-redesigned-pc-app-has-multiple-dark-modes-a-new-overlay-and-more-160019822.html) | the 2024/25 redesign scope |

Resolved values: HSL triplets in the token file are evaluated with `--saturation-factor: 1` and the
`color-mix(in oklab, X 100%, … 0%)` wrappers collapse to `X`.

> **Important revision note.** The long‑quoted classic hexes **`#313338`, `#2b2d31`, `#1e1f22`, `#4e5058`
> no longer appear anywhere** in Discord's current CSS (verified by scanning all 270 served CSS chunks).
> The current palette is the "visual refresh" one below. Also: `--background-primary`,
> `--background-secondary`, `--background-tertiary`, `--text-normal`, `--interactive-normal`,
> `--header-primary` and `--status-idle/dnd/offline/streaming` are **no longer defined or referenced**.

---

## 1. DARK THEME (`.theme-dark` = the default/lightest dark theme)

### Surfaces
| Purpose | Current variable | Dark value | Classic legacy name (pre‑2024) |
|---|---|---|---|
| App shell / `body` / outermost frame | `--background-base-lowest` | `#2c2d32` | `--background-tertiary` (was `#1e1f22`) |
| Channel sidebar | `--background-base-lower`, `--channel-background-default` | `#323339` | `--background-secondary` (was `#2b2d31`) |
| **Chat / message column** | `--chat-background` = `--primary-600` = `--neutral-69`; `.chatContent` uses `--background-base-lower` | `#323339` | `--background-primary` (was `#313338`) |
| Member list | `--custom-channel-members-bg` = `--background-base-lower` | `#323339` | — |
| Raised surface: chat input, modals, embeds, popouts, autocomplete | `--background-surface-high`, `--modal-background`, `--modal-footer-background`, `--embed-background`, `--chat-background-default` | `#393a41` | `--background-floating`/`--background-secondary-alt` |
| Higher raised surface | `--background-surface-higher` | `#3c3d45` | — |
| Highest raised surface | `--background-surface-highest` | `#3f4048` | — |
| "Low" control surface | `--background-base-low` | `#36373e` | — |
| Legacy alt sidebar | `--background-secondary-alt` | `#242429` | `--background-secondary-alt` |
| Home/DM background | `--home-background` | `#292a2f` | — |
| Accent (default embed bar, mentions rail, etc.) | `--background-accent` | `#41424a` | `--background-accent` (was `#4f545c`) |
| Lightbox / modal scrim | `--background-scrim-lightbox` / `--background-scrim` | `rgba(0,0,0,0.922)` / `rgba(0,0,0,0.722)` | — |
| Gradient (custom themes off ⇒ none) | `--background-gradient-*` | undefined by default | — |

### Borders / dividers (all are semi‑transparent white‑ish, **not** solid hex)
| Variable | Dark value | Notes |
|---|---|---|
| `--border-subtle` | `rgba(151, 151, 159, 0.122)` | 1px dividers, `--chat-border`, `--divider` |
| `--border-normal` | `rgba(151, 151, 159, 0.2)` | default embed accent bar fallback, inline‑code border |
| `--border-strong` | `rgba(151, 151, 159, 0.439)` | |
| `--border-muted` | `rgba(151, 151, 159, 0.039)` | |
| `--background-mod-subtle` / `-normal` / `-strong` / `-muted` | `.122` / `.161` / `.2` / `.078` alpha of `rgb(151,151,159)` | legacy `--background-modifier-*` |
| `--background-modifier-accent` (legacy) | ≈ `--border-subtle` | old value was `rgba(255,255,255,0.06)` |
| Divider rules | `height:1px; background-color: var(--border-subtle)` | e.g. `.divider__1de9c` |

### Text
| Purpose | Current variable | Dark value | Classic legacy name |
|---|---|---|---|
| Primary text | `--text-default` | `#f3f3f4` | `--text-normal` (was `#dbdee1`) |
| Strongest text / headings | `--text-strong` | `#ffffff` | `--header-primary` (was `#f2f3f5`) |
| Secondary text | `--text-subtle` | `#c5c6ca` | `--header-secondary` (was `#b5bac1`) |
| Muted text (timestamps, meta) | `--text-muted` | `#abacb2` | `--text-muted` (was `#949ba4`) |
| Chat muted | `--chat-text-muted` | `#9d9ea5` | — |
| Inactive channels | `--channels-default`, `--channel-icon` | `#999aa1` | `--channels-default` (was `#80848e`) |
| Text on inverted bg | `--text-invert` | `#2f3035` | — |
| Placeholder | `--input-placeholder-text-default` / `--channel-text-area-placeholder` | `#a4a5ab` / `#6c6d76` | — |
| Disabled/icon muted | `--interactive-muted` | `#4f505a` | `--interactive-muted` |

### Interactive
| State | Text/icon | Background |
|---|---|---|
| normal | `--interactive-text-default` / `--interactive-icon-default` = `#c5c6ca` | `--interactive-background-default` = `rgba(151,151,159,0.078)` |
| hover | `--interactive-text-hover` / `--interactive-icon-hover` = `#ffffff` | `--interactive-background-hover` = `rgba(151,151,159,0.122)` |
| active | `--interactive-text-active` / `--interactive-icon-active` = `#ffffff` | `--interactive-background-active` = `rgba(151,151,159,0.161)` |
| selected | — | `--interactive-background-selected` = `rgba(151,151,159,0.2)` |
| accent (brand) item | — | `--interactive-accent-background-default` = `rgba(151,151,159,0.122)`, `-hover`/`-selected` = `#5865f2`, `-active` = `#3a48a3` |

### Links & brand
| Variable | Dark value |
|---|---|
| `--text-link` / `--icon-link` | `#76aff6` |
| `--text-brand` / `--icon-brand` | `#94a8ff` |
| `--brand-500` | `#5865f2` (blurple) |
| `--brand-560` | `#4654c0` |
| `--brand-600` | `#3a48a3` |
| `--brand-360` | `#8ca0fd` |
| `--background-brand` | `#5865f2` |
| `--background-mod-*` blurple washes | `--brand-05a`…`--brand-30a` = `hsla(var(--brand-500-hsl)/0.05…0.3)` |

### Status colours
| State | `--icon-status-*` / `--text-status-*` (current) | `--status-*` (legacy, where still defined) |
|---|---|---|
| online | `#3d9e60` | `--status-online` = `#3d9e60` |
| idle | `#ffcb6e` | `--status-idle` **no longer defined** |
| dnd | `#dc4247` | `--status-dnd` **no longer defined** |
| offline | `#9d9ea5` | `--status-offline` **no longer defined** |
| streaming | **UNCERTAIN** – no token in current CSS; classic value `#593695` | `--status-streaming` **no longer defined** |
| speaking (voice) | `--icon-voice-speaking` / `--status-speaking` = `#3d9e60` | |
| voice connected / muted / disconnected | `#73c48b` / `#da3e44` / `#ffa09b` | |
| semantic | `--status-positive` `#3d9e60`, `--status-warning` `#fdb833`, `--status-danger` `#da3e44` | |
| feedback text | positive `#7ecb94`, warning `#fcb529`, critical `#ffa09b`, info `#8ebefa` | |
| feedback bg | positive `rgba(0,133,69,0.122)`, warning `rgba(248,163,0,0.078)`, critical `rgba(210,45,57,0.078)`, info `rgba(0,116,227,0.078)` | |

### Mentions
| Purpose | Variable | Dark value |
|---|---|---|
| "mentioned" message row background | `--message-mentioned-background-default` | `rgba(248, 163, 0, 0.078)`  *(8 % amber, composites to a brownish wash over `#323339`)* |
| mentioned row, hover | `--message-mentioned-background-hover` | `rgba(248, 163, 0, 0.039)` |
| mention **pill** background | `--mention-background` | `rgba(88, 101, 242, 0.239)` |
| mention pill text | `--mention-foreground` | `#cdd7ff` |
| "reply highlight" row (jump‑to) | `--message-highlight-background-default` / `-hover` | `rgba(88,101,242,0.161)` / `rgba(88,101,242,0.122)` |
| hover on any message row | `--message-background-hover` | `rgba(151,151,159,0.122)` |

### Code, spoilers, scrollbars
| Purpose | Variable | Dark value |
|---|---|---|
| Code **block** background | `.hljs { background: var(--background-base-lower) }` | `#323339` |
| Inline code background | `--background-code` | `rgba(88, 101, 242, 0.078)` |
| Code text | `--text-code` | `#ffffff` |
| Code comment / keyword / string / number / title | `--text-code-comment` `#b3b3b9`, `-keyword` `#ffbdb9`, `-string` `#96dda9`, `-number` `#fcc0a1`, `-title` `#bccaff` | |
| diff add / del bg | `--background-code-addition` `rgba(0,133,69,0.122)`, `--background-code-deletion` `rgba(210,45,57,0.122)` | |
| Spoiler hidden | `--spoiler-hidden-background` | `#7d7e87` |
| Spoiler hidden + hover | `--spoiler-hidden-background-hover` | `#9d9ea5` |
| Spoiler revealed | `--spoiler-revealed-background` | `#242429` |
| Scrollbar thin thumb / track | `--scrollbar-thin-thumb` / `--scrollbar-thin-track` | `#767780` / `transparent` |
| Scrollbar auto thumb / track | `--scrollbar-auto-thumb` / `--scrollbar-auto-track` | `#7d7e87` / `transparent` |
| `scrollbar-color` thumb / track | `--scrollbar-auto-scrollbar-color-thumb` / `-track` | `#73747d` / `#2b2b31` |

### Other dark variants (same selectors, different rung of the neutral ladder)
`.theme-darker` and `.theme-midnight` are the two extra dark themes added in the 2024/25 refresh
(user‑facing names "dark"/"onyx"; exact label↔class mapping is **UNCERTAIN**).

| Token | `.theme-dark` | `.theme-darker` | `.theme-midnight` |
|---|---|---|---|
| `--background-base-lowest` | `#2c2d32` | `#121214` | `#000000` |
| `--background-base-lower` | `#323339` | `#1a1a1e` | `#000000` |
| `--background-base-low` | `#36373e` | `#202024` | `#000000` |
| `--background-surface-high` | `#393a41` | `#242429` | `#0a0a0c` |
| `--background-surface-higher` | `#3c3d45` | `#28282d` | `#121214` |
| `--background-surface-highest` | `#3f4048` | `#2c2d32` | `#17181b` |
| `--text-default` | `#f3f3f4` | `#efeff1` | `#d4d5d8` |
| `--text-muted` | `#abacb2` | `#96979e` | `#81828a` |
| `--text-link` | `#76aff6` | `#4d96ee` | `#2781e7` |
| `--background-accent` | `#41424a` | `#393a41` | `#2c2d32` |

---

## 2. LIGHT THEME (`.theme-light`)

| Purpose | Variable | Light value |
|---|---|---|
| App shell / `body` | `--background-base-lowest` | `#f3f3f4` |
| Channel sidebar & chat column | `--background-base-lower`, `--channel-background-default`, `--chat-background` | `#fbfbfb` / `#fbfbfb` / `#ffffff` |
| `--background-base-low` | | `#fbfbfb` |
| Raised surface (modal, embed, popout, chat input) | `--background-surface-high` = `--background-surface-higher` = `--background-surface-highest`, `--modal-background`, `--embed-background`, `--chat-background-default` | `#ffffff` |
| `--background-secondary-alt` | | `#ebeced` |
| `--home-background` | | `#fbfbfb` |
| `--background-accent` | | `#6c6d76` |
| `--border-subtle` / `--chat-border` | | `rgba(151, 151, 159, 0.278)` |
| `--border-normal` | | `rgba(151, 151, 159, 0.4)` |
| `--border-strong` | | `rgba(151, 151, 159, 0.522)` |
| `--border-muted` | | `rgba(151, 151, 159, 0.2)` |
| `--background-mod-subtle/-normal/-strong/-muted` | | `.122` / `.161` / `.239` / `.078` alpha of `rgb(151,151,159)` |
| `--text-default` | | `#2e2e34` |
| `--text-strong` | | `#28282d` |
| `--text-subtle` | | `#595a63` |
| `--text-muted` | | `#6c6d76` |
| `--chat-text-muted` | | `#70717a` |
| `--channels-default` / `--channel-icon` | | `#666770` |
| `--interactive-text-default` / `--interactive-icon-default` | | `#595a63` |
| `--interactive-text-hover` / `-active` | | `#28282d` |
| `--interactive-muted` | | `#c9cace` |
| `--interactive-background-default / -hover / -active / -selected` | | `rgba(151,151,159,.078 / .122 / .161 / .239)` |
| `--text-link` / `--icon-link` | | `#006dd4` |
| `--text-brand` / `--icon-brand` | | `#525fe0` |
| `--brand-500` / `-560` / `-600` / `-360` | | `#5865f2` / `#4654c0` / `#3a48a3` / `#8ca0fd` (identical to dark) |
| `--icon-status-online` / `--text-status-online` | | `#01783e` |
| `--icon-status-idle` / `--text-status-idle` | | `#faaa00` |
| `--icon-status-dnd` / `--text-status-dnd` | | `#d22d39` |
| `--icon-status-offline` / `--text-status-offline` | | `#5f606a` |
| streaming | | **UNCERTAIN** (same as dark) |
| `--status-positive` / `--status-warning` / `--status-danger` | | `#269153` / `#bb7300` / `#d6363f` |
| feedback text | | positive `#01713a`, warning `#945300`, critical `#b92733`, info `#0361bc` |
| `--message-mentioned-background-default` / `-hover` | | `rgba(248,163,0,0.078)` / `rgba(248,163,0,0.122)` |
| `--mention-background` | | `rgba(88, 101, 242, 0.239)` |
| `--mention-foreground` | | `#2e3c88` |
| `--message-highlight-background-default` / `-hover` | | `rgba(88,101,242,0.161)` / `rgba(88,101,242,0.2)` |
| `--message-background-hover` | | `rgba(151,151,159,0.122)` |
| code block bg (`.hljs`) | `var(--background-base-lower)` | `#fbfbfb` |
| `--background-code` | | `rgba(88, 101, 242, 0.039)` |
| `--text-code` | | `#36373e` |
| `--spoiler-hidden-background` / `-hover` / revealed | | `#8f9097` / `#70717a` / `#ebeced` |
| `--scrollbar-thin-thumb` / `--scrollbar-auto-thumb` / `-color-thumb` | | `#8b8c94` / `#8f9097` / `#888991` |
| `--scrollbar-auto-scrollbar-color-track` | | `#efeff1` |

### Legacy → current alias shim (drop‑in, dark defaults)
```css
:root, .theme-dark {
  --background-primary:        var(--background-base-lower);   /* #323339 */
  --background-secondary:      var(--background-base-lower);   /* #323339 */
  --background-secondary-alt:  var(--background-secondary-alt);/* #242429 */
  --background-tertiary:       var(--background-base-lowest);  /* #2c2d32 */
  --background-floating:       var(--background-surface-high); /* #393a41 */
  --background-modifier-hover:    var(--interactive-background-hover);
  --background-modifier-selected: var(--interactive-background-selected);
  --background-modifier-accent:   var(--border-subtle);
  --text-normal:        var(--text-default);
  --header-primary:     var(--text-strong);
  --header-secondary:   var(--text-subtle);
  --interactive-normal: var(--interactive-text-default);
  --interactive-hover:  var(--interactive-text-hover);
  --interactive-active: var(--interactive-text-active);
  --status-online:  var(--icon-status-online);
  --status-idle:    var(--icon-status-idle);
  --status-dnd:     var(--icon-status-dnd);
  --status-offline: var(--icon-status-offline);
  --status-streaming: #593695; /* UNCERTAIN, verify against the live client */
}
```

---

## 3. ROLE COLOURS

**Default role colour:** the role editor's "Default" picker swatch is `--role-default: #99aab5`
(same value as discord.js `Greyple`). At the API level the default is `0x000000` (no colour) —
discord.js `Colors.Default = 0x000000`; roles with no colour render in the default text colour.

**Discord's own role preset variables** (present in the live client CSS as `--role-*`):

| Token | Hex | discord.js `Colors` name |
|---|---|---|
| `--role-default` | `#99aab5` | Greyple |
| `--role-light-blue` | `#99aab5` | Greyple |
| `--role-teal` | `#1abc9c` | Aqua |
| `--role-dark-teal` | `#11806a` | DarkAqua |
| `--role-green` | `#1f8b4c` | DarkGreen |
| `--role-light-green` | `#2ecc71` | (not in discord.js) |
| `--role-sky-blue` | `#3498db` | Blue |
| `--role-blue` | `#206694` | DarkBlue |
| `--role-dark-blue` | `#546e7a` | — |
| `--role-purple` | `#9b59b6` | Purple |
| `--role-dark-purple` | `#71368a` | DarkPurple |
| `--role-magenta` | `#e91e63` | LuminousVividPink |
| `--role-burgundy` | `#ad1457` | DarkVividPink |
| `--role-yellow` | `#f1c40f` | Gold |
| `--role-tan` | `#c27c0e` | DarkGold |
| `--role-orange` | `#e67e22` | Orange |
| `--role-brown` | `#a84300` | DarkOrange |
| `--role-salmon` | `#e74c3c` | — |
| `--role-terracotta` | `#992d22` | DarkRed |
| `--role-dark-grey` | `#607d8b` | — |
| `--role-grey` | `#979c9f` | DarkGrey |
| `--role-light-grey` | `#95a5a6` | Grey |

**Full discord.js `Colors` set** (the well‑known hex list used for bot/role names) —
source: [discord.js Colors](https://discord.js.org/docs/packages/discord.js/main/Colors%3AVariable):

| Name | Hex | Name | Hex |
|---|---|---|---|
| Default | `#000000` | DarkGold | `#c27c0e` |
| White | `#ffffff` | Gold | `#f1c40f` |
| Aqua | `#1abc9c` | Orange | `#e67e22` |
| DarkAqua | `#11806a` | DarkOrange | `#a84300` |
| Green | `#57f287` | Red | `#ed4245` |
| DarkGreen | `#1f8b4c` | DarkRed | `#992d22` |
| Blue | `#3498db` | Grey | `#95a5a6` |
| DarkBlue | `#206694` | DarkGrey | `#979c9f` |
| Purple | `#9b59b6` | DarkerGrey | `#7f8c8d` |
| DarkPurple | `#71368a` | LightGrey | `#bcc0c0` |
| LuminousVividPink | `#e91e63` | Navy | `#34495e` |
| DarkVividPink | `#ad1457` | DarkNavy | `#2c3e50` |
| Fuchsia | `#eb459e` | Yellow | `#fee75c` |
| Blurple | `#5865f2` | NotQuiteBlack | `#23272a` |
| Greyple | `#99aab5` | DarkButNotBlack | `#2c2f33` |

---

## 4. TYPOGRAPHY

### Font stacks (verbatim from the live client)
```css
--font-primary: "gg sans","Noto Sans","Helvetica Neue",Helvetica,Arial,sans-serif;
--font-headline: "ABC Ginto Nord","Noto Sans","Helvetica Neue",Helvetica,Arial,sans-serif;
--font-display-marketing: "ABC Ginto Discord","gg sans",serif,"Noto Sans","Helvetica Neue",Helvetica,Arial,sans-serif;
--font-display-marketing-header: "ABC Ginto Discord Nord","gg sans",serif,"Noto Sans","Helvetica Neue",Helvetica,Arial,sans-serif;
--font-nitro: "ABC Ginto Discord Nord","Noto Sans","Helvetica Neue",Helvetica,Arial,sans-serif;
--font-code: "gg mono","Source Code Pro",Consolas,"Andale Mono WT","Andale Mono","Lucida Console",
             "Lucida Sans Typewriter","DejaVu Sans Mono","Bitstream Vera Sans Mono","Liberation Mono",
             "Nimbus Mono L",Monaco,"Courier New",Courier,monospace;
--font-clan-body: Fraunces,"gg sans",serif,"Noto Sans","Helvetica Neue",Helvetica,Arial,sans-serif;
--font-clan-signature: Corinthia,"gg sans",cursive,"Noto Sans","Helvetica Neue",Helvetica,Arial,sans-serif;
```
* The custom UI font's **real name is literally `gg sans`** (Discord's in‑house font, the Whitney replacement).
  Its display/wordmark faces are **`ABC Ginto Nord` / `ABC Ginto Discord Nord`** (licensed from ABC Dinamo);
  its mono face is **`gg mono`**. Discord ships `@font-face` for weights 400/500/600/700/800 (+ italics)
  for `gg sans`, and 400/700 for `gg mono`.
* Locale overrides exist: `:root:lang(ko|ja|zh-CN|zh-TW|bg|el|ru|uk)` replace the fallback chain after `"gg sans"`.
* Weights: `--font-weight-light:300; normal:400; medium:500; semibold:600; bold:700; extra-bold:800; black:900`.

### Discord's own text‑style scale (class names are literal, e.g. `text-sm/medium`)
| Style class | font‑size | line‑height (ratio → px) |
|---|---|---|
| `text-xxs/*` | 10px | 1.2 → 12px |
| `text-xs/*` | 12px | 1.3333 → 16px |
| `text-sm/*` | 14px | 1.2857 → 18px |
| `text-md/*` | 16px | 1.25 → 20px |
| `text-lg/*` | 20px | 1.2 → 24px |
| `heading-xs/*` | 14px | 1.2857 → 18px |
| `heading-sm/*` / `heading-md/*` | 16px | 1.25 → 20px |
| `heading-lg/*` | 20px | 1.2 → 24px |
| `heading-xl/*` | 24px | 1.25 → 30px |
| `heading-xxl/*` | 32px | 1.25 → 40px |
| `redesign/channel-title/*` | 16px | 1.375 → 22px |
| `redesign/heading-18/*` | 18px | 1.3333 → 24px |
| `redesign/message-preview/*` | 15px | 1.3333 → 20px |
| `experimental/footnote/*` | 10px | 1.2 → 12px |

`*` = weight variants `normal 400 / medium 500 / semibold 600 / bold 700 / extrabold 800`.

### Chat‑relevant type
| Element | Value | Source |
|---|---|---|
| Chat message body | `font-size: 1rem` (16px), `font-weight: 400`, `line-height: var(--chat-markup-line-height)` = **1.375rem (22px)** | `.markup__75297` |
| Message body colour | `var(--custom-message-content-color, var(--text-default))` | `.markup__75297` |
| Username | 16px / 500 (`--font-weight-medium`) | third-party (skyra) + design‑system scale |
| Timestamp | **12px**, weight 500, colour `--text-muted` (`#abacb2` dark / `#6c6d76` light) | third-party (skyra: 12px) — the message chunk is not in the public bundle |
| Edited tag | 10px | third-party (skyra) |
| Code block text | `.markup pre { font-size: .75rem (12px); line-height: 1rem (16px) }`; `.codeLine/.codeBlockText { font-size: 85% }` (≈13.6px) | live CSS |
| Inline code | `.markup code { font-size: .875rem (14px); line-height: 1.125rem (18px) }`; `.markup code.inline { font-size: 85%; margin: -.2em 0; padding: 0 .2em }`; `.inlineCode_ada32f { font-size: 85%; line-height: 18px }` | live CSS |
| Embed title | `.embedTitle { font-size: 1rem; font-weight: 600 }` | live CSS |
| Embed author name | `.embedAuthorName { font-size: .875rem; font-weight: 600 }` | live CSS |
| Embed description / field value | **UNCERTAIN** – the live `.embedDescription`/`.embedFooterText` rules set no size, so they inherit 16px in this stylesheet; older clients and clones use `.875rem (14px)` / `line-height 1.125rem (18px)`. Treat 14px/18px as the practical value. | live CSS + skyra / discord.css |
| Embed footer | skyra: `font-size: 12px; line-height: 16px; font-weight: 500` (live CSS only sets the colour = `--text-default` and a medium weight in light theme) | third-party (skyra) |
| Small / `<small>` in markup | `.875rem (14px)`, line‑height `1.20313rem`, colour `--text-subtle` | live CSS |
| Sub‑text / footnote | 10–12px (see scale above) | live CSS |

---

## 5. GEOMETRY / SPACING

### Global scales
```css
--space-0:0; --space-4:4px; --space-6:6px; --space-8:8px; --space-10:10px; --space-12:12px;
--space-16:16px; --space-20:20px; --space-24:24px; --space-26:26px; --space-30:30px; --space-32:32px;
--space-40:40px; --space-48:48px; --space-64:64px; --space-80:80px; --space-96:96px;
--space-128:128px; --space-160:160px; --space-192:192px;
--space-xxs:var(--space-4); --space-xs:var(--space-8); --space-sm:var(--space-12);
--space-md:var(--space-16); --space-lg:var(--space-20); --space-xl:var(--space-24); --space-xxl:var(--space-32);

--radius-none:0; --radius-xs:4px; --radius-sm:8px; --radius-md:12px; --radius-lg:16px;
--radius-xl:24px; --radius-xxl:32px; --radius-round:2147483647px;
```

### Message row (cozy / compact)
| Thing | Variable / rule | Value |
|---|---|---|
| Avatar (cozy) | `--custom-message-avatar-size`, `--chat-avatar-size` | **40px** |
| Avatar decoration | `--custom-message-avatar-decoration-size` | `calc(40px * --decoration-to-avatar-ratio)` |
| Avatar ↔ content gap | `--custom-message-margin-horizontal` | `var(--space-md)` = **16px** (this is also the left/right message gutter) |
| Message **left padding** (cozy) | `--custom-message-margin-left-content-cozy` | `calc(40px + 16px + 16px)` = **72px** |
| Message **right padding** | third-party (skyra): `.discord-message{padding-right:48px}` | **48px** — *UNCERTAIN*, message chunk not publicly fetchable |
| Compact continuation indent | `--custom-message-margin-compact-indent` | `5rem` = **80px** |
| Vertical padding, cozy | `--custom-message-spacing-vertical-container-cozy` | `0.125rem` = **2px** |
| Vertical padding, compact | `--custom-message-padding-vertical-container-compact` | `0.125rem` = **2px** |
| Meta gap (avatar↔name) | `--custom-message-meta-space` | `0.25rem` = **4px** |
| Compact avatar | **UNCERTAIN** — no compact avatar token exists; Discord compact mode hides the avatar and reveals a small one (~16px) on hover. | |
| Channel header height | `--custom-channel-header-height` | **49px** |
| Chat input height | `--custom-channel-textarea-text-area-height` | 44px / 56px / `var(--form-input-height)` = 44px |
| Chat input bottom margin | `--custom-chat-input-margin-bottom` | `var(--space-xs)` = **8px** |
| Guild rail avatar / folder | `--guildbar-avatar-size` / `--guildbar-folder-size` | **40px** / **48px** (+`.refresh-fast-follow-avatars` bumps avatar to 44px) |
| Guild list padding / width | `--custom-guild-list-padding` / `--custom-guild-list-width` | 16px / `calc(40px + 16px*2)` = **72px** |
| Channel sidebar width | `--custom-guild-sidebar-width` | **268px** |
| Member list width | `--custom-member-list-width` | 256 / 264 / 268px |
| Settings sidebar | `--custom-standard-sidebar-view-sidebar-total-width` | 264px (content 192px) |

### Reply line
| Thing | Value | Source |
|---|---|---|
| Reply text size / line‑height | `--custom-message-reply-message-preview-line-height` = **1.125rem (18px)**; skyra uses `font-size:.875rem` | live CSS + skyra |
| Reply indent | `--custom-message-reply-indent` = `0.625rem` = **10px** | live CSS |
| Line colour | `--spine-default` — dark **`#595a63`**, light **`#c5c6ca`** (used by the blockquote/thread "spine"); classic client used `#4f545c` dark / `#747f8d` light | live CSS token + skya |
| Line geometry | 2px `border-left` + 2px `border-top`, `border-top-left-radius: 6px`; positioned `left:-36px`, `top:50%`, extending to the reply row, `margin-right:4px` | **third-party (skyra, legacy values)** — verify visually |
| Reply badge / mini avatar | 16×16px, `border-radius:50%`, `margin-right:0.25rem` | third-party (skyra) |

### Embed layout
| Thing | Value | Source |
|---|---|---|
| Left accent bar | `border-inline-start: 4px solid <embed colour>` | live CSS `.embedFull__623de` |
| Other borders | `border: 1px solid var(--border-subtle)` | live CSS |
| Corner radius | `4px` | live CSS `.embed__623de` |
| Background | `var(--background-surface-high)` (`#393a41` dark / `#ffffff` light) | live CSS |
| Inner padding | `.grid { padding-block: .5rem 1rem; padding-inline: .75rem 1rem; padding-top: .125rem }` → **top 2px, right 16px, bottom 16px, left 12px** | live CSS |
| Max width | `.gridContainer { max-width: 516px }`, `.inlineMediaEmbed { max-width: 520px }`; classic `max-width: 32.25rem` (516px) | live CSS + discord.css |
| Fields container | `.embedFields { display:grid; grid-column:1/1; margin-top:8px; grid-gap:8px }` | live CSS |
| Block field width | full row (`grid-column:1/1`, `min-inline-size:100%`) | live CSS + discord.css |
| Inline field width | 12‑column grid: 1st `grid-column:1/5`, 2nd `5/9`, 3rd `9/13`; `min-width:150px`, `flex-grow:1` | **third-party (skyra / discord.css)** |
| Embed top margin | `.embedMargin { margin-top: 8px }` | live CSS |
| Author icon | 24×24, `border-radius:50%`, `margin-inline-end:8px` | live CSS |
| Footer icon | 20×20, `border-radius:50%`, `margin-inline-end:8px`; separator `margin:0 4px` | live CSS |
| Thumbnail | `grid-column:2; grid-row:1/8; justify-self:end; margin-inline-start:16px; margin-top:8px` (classic max 80×80) | live CSS + discord.css |
| Media radius | `.embedMedia, .embedImage img, .embedThumbnail img, .embedVideo img { border-radius:4px }` | live CSS |
| Gallery | `column-gap:4px; margin-top:16px; border-radius:4px; grid-template-columns:1fr 1fr` | live CSS |
| Spoiler blur on hidden embed | `filter: blur(var(--custom-embed-spoiler-blur-radius))` = **44px** | live CSS |

### Attachments / images
| Thing | Value | Source |
|---|---|---|
| Attachment radius | `.attachment { border-radius: 6px }`; `.imageWrapper { border-radius: 3px }`; media block `.media__9c640 { border-radius: var(--radius-md) = 12px }` | live CSS |
| Upload thumbnail size | `--custom-channel-attachment-upload-mini-attachment-size` = **78px** | live CSS |
| Attachment spoiler blur | `--custom-message-attachment-spoiler-blur-radius` = **44px** | live CSS |
| Max sizes | **UNCERTAIN** — the message media wrapper lives in a chunk not served to anonymous clients. Classic single‑image cap was 550×350 CSS px; the current `.gridContainer` embed cap is 516px. | |

### Reaction pill
Colours are authoritative‑current; geometry is third‑party/legacy (skyra) because the reaction component CSS is not in the publicly fetchable bundle.

| Property | Value |
|---|---|
| Background, not reacted | `--reaction-background-default` = `rgba(151,151,159,0.122)` (light: same) |
| Background, hover | `--reaction-background-hover` = `rgba(151,151,159,0.161)` |
| Background, active | `--reaction-background-active` = `rgba(151,151,159,0.2)` |
| Background, **reacted** | `--reaction-background-reacted-default` = **`rgba(88,101,242,0.239)`** (≈24 % blurple, *not* the old 15 %) |
| Border, default | `1px solid var(--reaction-border-default)` = `rgba(151,151,159,0.122)` (light `.278`) |
| Border, hover | `1px solid var(--reaction-border-hover)` = `rgba(151,151,159,0.039)` |
| Border, reacted | `1px solid var(--reaction-border-reacted-default)` = **`#5865f2`** |
| Count text | `--reaction-text-default` `#c5c6ca`; hover `#ffffff`; reacted `--reaction-text-reacted-default` = `#dfe4ff` (light `#273478`) |
| Radius | `0.5rem` = **8px** |
| Padding (inner) | `0.125rem 0.375rem` = **2px 6px** |
| Emoji size | **16×16px**, `margin: 0.125rem 0` |
| Count font | **14px / 500**, `margin-left: 0.375rem (6px)` |
| Pill spacing | `margin-right: 4px; margin-bottom: 4px` |
| Implied pill height | ≈ 22–26px (16px emoji + 2px padding + 1px border each side) |

### Action / hover toolbar row
**UNCERTAIN.** The message hover toolbar lives in the same non‑public message chunk. What is known:
buttons are 32×32px icon buttons using `--radius-xs`/`--radius-sm`, hover background
`--interactive-background-hover` (`rgba(151,151,159,0.122)`), icon colour `--interactive-icon-default`
(`#c5c6ca`) → `--interactive-icon-hover` (`#ffffff`), and the row sits at the message's top‑right.
Verify against the live client before shipping exact offsets.

### Code block
```css
.hljs { border-radius:4px; display:block; overflow-x:auto; padding:.5em;
        background:var(--background-base-lower); color:var(--text-code); }
.markup pre { border-radius:4px; font-family:var(--font-code);
              font-size:.75rem; line-height:1rem; margin-top:6px; padding:0; }
.markup code.inline { border-radius:4px; font-family:var(--font-code);
                      font-size:85%; margin:-.2em 0; padding:0 .2em;
                      background:var(--background-code); border:1px solid var(--border-normal); }
```
Language label colour: `.codeBlockLang { color: var(--text-feedback-positive) }`; `codeActions` popout sits at `top:8px; inset-inline-end:4px`.

### Blockquote
```css
.markup blockquote            { color: var(--text-subtle); text-indent: 0; max-width: 90%; }
.blockquoteContainer          { display:flex; margin-block: var(--space-4); }   /* 4px top + bottom */
.blockquoteContainer .blockquoteDivider { width:4px; min-width:4px; border-radius:4px;
                                          background-color: var(--spine-default); }
.blockquoteContainer blockquote { padding-block:0; padding-inline:12px 8px; }
```
* Left bar: **4px wide**, radius 4px, colour `--spine-default` (`#595a63` dark / `#c5c6ca` light).
* Text padding: **12px left, 8px right**.

### Lists
```css
.markup li { margin-bottom: 4px; white-space: break-spaces; }
/* inline‑format lists only — the normal list indent is not overridden in the fetched CSS */
.inlineFormat li:before      { content:"•"; padding-inline-end:4px; }
.inlineFormat li li:before   { content:"○"; font-size:.625rem; line-height:1rem; padding:0 4px 4px; }
```
* Marker: `•` (disc) with `○` for nested unordered; ordered inline lists use a counter + `.`.
* **Indent: UNCERTAIN** — Discord does not override the browser default `ul/ol { padding-inline-start: 40px }` in the fetched stylesheet, so ~40px (2.5em) is the safe value.

### Dividers
`height: 1px; background-color: var(--border-subtle)` → `rgba(151,151,159,0.122)` dark / `rgba(151,151,159,0.278)` light.
Some dividers use `hsl(var(--primary-630-hsl)/.6)` = `rgba(35,36,41,0.6)` in dark.

### System messages
Discord's own fetched CSS only pins the colour: `.stageSystemMessage { color: var(--text-strong) }`,
and system text generally uses `--chat-text-muted` (`#9d9ea5` dark / `#70717a` light).
Geometry (third‑party, skyra — verify):
```css
.system-message { font-size:1rem; font-weight:400; color:#8e9297; padding:0 1em 0 1em;
                  padding-right:48px; min-height:1.375rem; margin-top:1.0625rem; }
.system-message .icon  { margin-right:16px; margin-top:5px; min-width:40px; }   /* icon 16×16 */
.system-message .timestamp { font-size:12px; margin-left:3px; color:#72767d; }
/* boost icon #ff73fa, alert/error icon #faa81a */
```

---

## 6. EMBED ACCENT BAR

* The API sends `embed.color` as a **24‑bit integer** (`0xRRGGBB`). The client converts it to
  `rgb(r, g, b)` and applies it to the embed's border colour.
* Live CSS default before that inline override:
  ```css
  .embedFull__623de {
    background: var(--background-surface-high);
    border: 1px solid var(--border-subtle);
    border-inline-start: 4px solid var(--border-normal);   /* 4px accent bar */
  }
  .embedFull__623de.isHidden__623de { border-inline-start: 0; }
  ```
  (`--border-normal` = `rgba(151,151,159,0.2)` dark / `rgba(151,151,159,0.4)` light.)
* **Default embed colour when `color` is omitted:** the CSS fallback is `--border-normal`, which
  composites to ≈ **`#4c4d54`** over the `#393a41` embed background in the dark theme — i.e. a neutral
  grey bar. The classic client used a solid **`#4f545c`** (dark) / **`#e3e5e8`** (light); skyra ships
  `#202225` / `#e3e5e8`. **UNCERTAIN** which single value the current client inlines — the embed
  renderer is in a non‑public chunk.
* Embedded *body* background (different thing) is `#2b2d31` classic → now `--background-surface-high`
  (`#393a41` dark / `#ffffff` light); Pycord documents the classic values `0x2B2D31` dark / `0xEEEFF1`
  light / `0x000000` AMOLED
  ([Pycord commit](https://github.com/Pycord-Development/pycord/commit/b6bd0c83291fb9f9243df1c7eb99b67b5f157989)).

---

## 7. TIMESTAMPS

Syntax `<t:UNIX_SECONDS:FLAG>`. Exact flag table from the
[Discord API reference](https://docs.discord.com/developers/reference#message-formatting-timestamp-styles)
(also [discord.js `TimestampStyles`](https://discord.js.org/docs/packages/formatters/0.6.0/TimestampStyles:Variable)):

| Flag | Example output (en‑US, UTC in docs) | Meaning | Intl parts |
|---|---|---|---|
| `t` | `16:20` | Short Time | `{hour:'numeric', minute:'2-digit'}` |
| `T` | `16:20:30` | Medium/Long Time | `+ {second:'2-digit'}` |
| `d` | `20/04/2021` | Short Date | `{day:'2-digit', month:'2-digit', year:'numeric'}` |
| `D` | `April 20, 2021` | Long Date | `{day:'numeric', month:'long', year:'numeric'}` |
| `f` *(default)* | `April 20, 2021 at 16:20` | Long Date, Short Time | `D` + `t` |
| `F` | `Tuesday, April 20, 2021 at 16:20` | Full Date, Short Time | `{weekday:'long'}` + `f` |
| `s` | `20/04/2021, 16:20` | Short Date, Short Time | `d` + `t` |
| `S` | `20/04/2021, 16:20:30` | Short Date, Medium Time | `d` + `T` |
| `R` | `4 years ago` | Relative Time | `Intl.RelativeTimeFormat` |

* All flags are rendered in the **viewer's locale and timezone**; `f` is the default if the flag is omitted.
* **`R` relative output** is produced with `Intl.RelativeTimeFormat(locale, { numeric: 'auto' })`
  style phrasing: `just now`/`now`, `a few seconds ago`, `2 hours ago`, `yesterday`,
  `in 3 days`, `in 2 months` — the exact string set is locale dependent and not fixed by Discord
  ([dev.to guide](https://dev.to/unixlytools/discord-timestamp-generator-complete-guide-with-examples-11fh)).
  The `numeric:'auto'` mode is what produces `yesterday`/`tomorrow` instead of `1 day ago`/`in 1 day`.
  **UNCERTAIN** at the second level: whether sub‑minute values read `now` or `a few seconds ago` —
  verify against the live client.
* In the **client UI**, the timestamp next to a username is the short time (`t`-like, e.g. `Today at 4:32 PM`),
  rendered at **12px / 500** in `--text-muted`; hovering reveals the full date (`F`-like) in a tooltip.

---

## 8. NOTABLE 2024+ CHANGES A REIMPLEMENTATION SHOULD FOLLOW

Source: [Engadget, 25 Mar 2025](https://www.engadget.com/gaming/pc/discords-redesigned-pc-app-has-multiple-dark-modes-a-new-overlay-and-more-160019822.html)
plus the `.visual-refresh` / new-token evidence in the live CSS.

1. **New token vocabulary.** The old `--background-primary/secondary/tertiary`, `--text-normal`,
   `--header-primary/secondary`, `--interactive-normal` family is **gone**. Use the layered
   `--background-base-lowest/lower/low` + `--background-surface-high/higher/highest` model and
   `--text-default/strong/subtle/muted`, `--interactive-text-*`, `--interactive-background-*`.
2. **Four free themes**, not two: `.theme-light`, `.theme-dark`, `.theme-darker`, `.theme-midnight`
   (user‑facing light / ash / dark / onyx). `.theme-dark` is no longer "the dark theme" — it is the
   lightest dark theme (`#2c2d32` rail).
3. **Colour shift.** Neutral surfaces moved to a slightly bluer/lighter ladder: rail `#1e1f22 → #2c2d32`,
   sidebar/chat `#313338 → #323339`, raised surfaces `#2b2d31 → #393a41`.
4. **Sidebar and chat now share one background** (`--background-base-lower`, `#323339`); the earlier
   distinction between `--background-primary` (chat) and `--background-secondary` (sidebar) is gone.
5. **Overlays instead of solid hovers.** All hover/active/divider colours are now low‑alpha
   `rgb(151,151,159)` washes (`.039 – .522` alpha depending on theme), not solid greys.
6. **Three UI density modes** — default, spacious, compact — are separate from the classic
   message layout modes (cozy / compact). The CSS density blocks are `.density-default`,
   `.density-cozy`, `.density-compact`, each overriding `--space-xs/sm/md/...` and
   `--channels-name-line-height`.
7. **Resizable channel list** and relocated voice/video call controls (centre bottom bar).
8. **Fonts unchanged** — still `gg sans` + `gg mono`, ABC Ginto for display.
9. **Blurple unchanged** — `--brand-500` is still `#5865f2`, still reserved for brand/CTAs/mentions.
10. **Mention/reaction washes were re‑tuned** — mention pill is a 24 % blurple overlay
    (`rgba(88,101,242,0.239)`), "mentioned" rows are an 8 % amber overlay (`rgba(248,163,0,0.078)`),
    and reacted reaction pills use the same 24 % blurple rather than the old 15 %.
11. **Link colour changed** — dark‑theme links are now `#76aff6` (was `#00a8fc`); light theme `#006dd4`.

---

## Known gaps / things I could not confirm from an authoritative source

| Item | Status |
|---|---|
| `--status-streaming` (streaming purple) | not defined in current CSS; classic `#593695` — UNCERTAIN |
| Pixel‑exact message right padding, avatar size in compact mode, action toolbar offsets, attachment max sizes | live in a lazy‑loaded bundle chunk not served to anonymous clients; values above are third‑party/legacy — UNCERTAIN |
| Exact reaction‑pill box height and padding | third‑party (skyra) — UNCERTAIN |
| Reply line exact geometry/colour | `--custom-message-reply-indent: 10px` confirmed; 2px/6px curve + `--spine-default` colour is best‑effort — UNCERTAIN |
| Embed description / field value / footer font sizes | live CSS sets no size (inherits 16px); clones use 14px/18px — UNCERTAIN |
| List indent | browser default (~40px) — UNCERTAIN |
| Default embed accent hex | CSS fallback `--border-normal` (≈`#4c4d54` composited); classic `#4f545c` — UNCERTAIN |
| `.theme-darker`/`.theme-midnight` ↔ "dark"/"onyx" label mapping | inferred — UNCERTAIN |

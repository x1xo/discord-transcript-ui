# discord-transcript-ui

**Rendering Discord transcripts from a single stylesheet and one optional script — no
Shadow DOM, no framework, no build step for the people viewing them.**

The point is storage. Inlining Discord's styles and components into every exported
transcript makes each file large and every file pay for the same bytes. Here the styling
lives in one CSS file and the behaviour in one small script, both cached by the browser
across *all* transcripts, and both loadable from several CDNs with a fallback chain.

| Artifact | Raw | gzip | brotli |
| --- | --- | --- | --- |
| `discord-transcript.min.css` (default tags) | 33.4 KB | **6.2 KB** | 5.5 KB |
| `discord-transcript.short.min.css` (compact tags, opt-in) | 29.0 KB | **6.0 KB** | 5.3 KB |
| `discord-transcript.min.js` (optional) | 14.9 KB | **4.8 KB** | 4.2 KB |

A transcript HTML file then contains only its own text and markup.

## Quick start

```html
<!doctype html>
<html lang="en">
	<head>
		<meta charset="utf-8" />
		<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/discord-transcript-ui@1.0.1/dist/discord-transcript.min.css" />
		<script>
			window.$discordMessage = {
				profiles: {
					miona: { author: 'Miona', avatar: '…', roleColor: '#5865f2', bot: true, verified: true }
				}
			};
		</script>
		<script src="https://cdn.jsdelivr.net/npm/discord-transcript-ui@1.0.1/dist/discord-transcript.min.js" defer></script>
	</head>
	<body class="dt-page">
		<div class="dt-page__inner">
			<discord-messages channel-name="general" channel-type="text">
				<discord-message profile="miona" timestamp="2024-03-15T14:31:00Z">
					Hello, <discord-mention>Piton</discord-mention>!
				</discord-message>
			</discord-messages>
		</div>
	</body>
</html>
```

For a real transcript, generate the file with the multi-mirror bootstrap instead of a
single link tag:

```bash
npm run build
node tools/scaffold.mjs --body examples/messages.html \
     --config examples/config.js --out transcript.html --title "general — 2024-03-15"
```

That writes the recovery comment, the profile config and the fallback chain for you.
Open `demo/index.html` for a full gallery of every supported component, and
`demo/no-js.html` to see exactly what survives without the script.

## What it renders

Messages and continuation rows · author info with bot/verified/server/OP badges · replies ·
mentions with `@`/`#` · timestamps (`t T d D f F R s S`) · spoilers · embeds with fields,
footer, thumbnail and media · image, video, audio and file attachments · reactions ·
system messages · threads · slash-command lines · buttons and action rows · headings,
bold/italic/underline/strikethrough, inline and block code, quotes, lists and links.

Everything degrades: without the script, author names come from `attr(author)`, mentions
add their own `@`/`#`, reactions show emoji + count, file cards render from attributes, and
any nested `<img>`/`<video>`/`<audio>` still plays. See the table in `docs/SPEC.md §10`.

## Project layout

```
src/discord-transcript.css     the single stylesheet (hand-written, flattened, themed with --dt-* tokens)
src/discord-transcript.js      the optional enhancement layer (vanilla, ~5 KB gzip)
build/build.mjs                minify + sha256/SRI manifest + dist/v<version>/ copies
build/verify.mjs               headless-Chrome assertions over computed styles and layout
build/serve.mjs                tiny static server for previewing the demo
tools/scaffold.mjs             fragment + config -> finished CDN transcript
assets/cdn-loader.html         the multi-mirror bootstrap that goes into transcripts
demo/                          component gallery, and a no-script degradation page
examples/                      a body fragment, a config, and a generated transcript
docs/SPEC.md                   the markup contract your parser is built against
docs/CDN-STRATEGY.md           keeping archived transcripts alive for 5-10 years
docs/DESIGN-TOKENS.md          Discord's live design tokens, with sources and open questions
```

## Keeping the Go renderer in sync

The Go renderer (`discord-transcript-go/`) reuses this build: it links these
artifacts and emits this markup contract. Three things couple the two, and all
three are derived from this repository's build output:

1. the contract version (this package's version);
2. the pinned CDN URLs and Subresource Integrity hashes;
3. the compact tag vocabulary from `build/short-tags.mjs`.

Rather than hand-copying them, `npm run build` writes them into two files the Go
side never edits:

| Generated file | Contents |
| --- | --- |
| `discord-transcript-go/transcript/pins.go` | `ContractVersion`, the jsDelivr URLs and SRI hashes for both stylesheets and the script |
| `discord-transcript-go/transcript/tags_gen.go` | the compact tag mapping |

`npm run build:check` fails if either is stale, and the Go suite has a matching
test that catches a hand edit or a rebuild the sync could not see. Point
`DISCORD_TRANSCRIPT_GO_DIR` at the module if it is not checked out at
`./discord-transcript-go`; if it is absent, the build prints a note and carries
on, so consumers who only want the stylesheet are unaffected.

## Scripts

| Command | Does |
| --- | --- |
| `npm run build` | Writes `dist/` (minified, unminified, versioned copies, `manifest.json`, recovery comment) and prints sizes. |
| `npm run build:check` | Fails if `dist/` does not match `src/` — put this in CI. |
| `npm run verify` | Launches headless Chrome and asserts computed styles on the enhanced page, the no-script page and the bootstrap page. |
| `npm run scaffold -- --body … --out …` | Generates a finished transcript file. |
| `npm run serve` | Serves the repo at `http://127.0.0.1:8080/demo/`. |

## Design notes

* **Light DOM only.** A CDN stylesheet cannot reach into Shadow DOM, so components are
  plain custom elements styled globally. That is also why there is no `::part()`.
* **Content belongs in markup, chrome in attributes.** Attributes are for things the script
  can reconstruct (avatars from a profile, formatted dates); text, descriptions, fields and
  media stay as real HTML so they survive a broken CDN.
* **Theming is data.** Every colour, size and font is a `--dt-*` custom property; override
  them on `:root`, on `<discord-messages>`, or per element. Values follow Discord's current
  "visual refresh" palette (`docs/DESIGN-TOKENS.md`).
* **Tag names match `@skyra/discord-components-core`** where it makes sense, so existing
  knowledge transfers — but this is an independent light-DOM implementation, not a fork.
  The differences are listed in `docs/SPEC.md §12`.

## Publishing your own copy

The package name, repository and CDN list live in `lib.config.json`. Change them **before
the first release** (after that the URLs are frozen into archived transcripts), then follow
`docs/CDN-STRATEGY.md §6`. The build emits byte-identical copies under `dist/v<version>/`
for tag-based hosts and computes SRI hashes for every artifact.

## Licence

MIT. Tag names and attribute conventions follow
[`@skyra/discord-components`](https://github.com/skyra-project/discord-components) (MIT);
no code or stylesheet text is copied from it. See `ATTRIBUTION.md`. Discord is a trademark
of Discord Inc.; this project is unaffiliated with Discord and with Skyra.

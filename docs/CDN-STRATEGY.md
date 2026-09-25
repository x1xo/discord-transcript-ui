# Keeping archived transcripts alive

The goal: a transcript written today should still render in 5–10 years, even though it
contains no styles or scripts of its own. That means the two asset URLs it points at must
survive CDN shutdowns, npm accidents, lost domains and your own disinterest.

Nothing can make a URL immortal on its own. What makes this work is **layering independent
copies, pinning exact bytes, and recording enough information in the file itself that a
stranger can repair it.** This document is that plan.

---

## 1. Threat model

| Failure | Blast radius | Mitigation |
| --- | --- | --- |
| A CDN has an outage | One mirror down | Client-side fallback chain |
| A CDN tightens policy or shuts down (e.g. a free tier ending) | One mirror gone | Multiple mirrors on different infrastructure |
| You lose the npm account or package name | jsDelivr + unpkg gone together (both are npm-derived) | GitHub tag copy, object storage, IPFS, Wayback |
| You lose the domain | Self-hosted mirror gone | Everything else keeps working |
| npm unpublish / malicious republish at the same version | SRI mismatch | SRI on npm mirrors, immutable version pinning, manifest hashes |
| A file gets renamed or moved in a later release | Old transcripts 404 | Immutable `dist/` layout + a `v<version>/` copy, never edited |
| You disappear | No maintainer | Recovery comment in each HTML; mirrors listed; source archived in Software Heritage |

## 2. The tiers

### Tier 0 — sources of truth (you own these)

| What | Where | Command |
| --- | --- | --- |
| Source + history | GitHub repository | `git push origin main --tags` |
| Release tarball with the built assets | GitHub Releases | attach `dist/` as an artifact |
| Published package | npm | `npm publish` (never unpublish) |
| Raw dist bytes | object storage (Cloudflare R2, S3, B2 — free tiers are plenty for two files) | `aws s3 sync dist/ s3://<bucket>/v1.0.0/ --cache-control 'public,max-age=31536000,immutable'` |

### Tier 1 — primary mirrors (npm-derived, zero work)

These stay correct as long as the npm version exists, which is why `publishConfig.access`
is public and why you never unpublish.

```
https://cdn.jsdelivr.net/npm/discord-transcript-ui@1.0.0/dist/discord-transcript.min.css
https://unpkg.com/discord-transcript-ui@1.0.0/dist/discord-transcript.min.js
```

* Both support **SRI** and send CORS headers, so the loader applies `integrity` to these first.
* `esm.run` / `esm.sh` are available as extra JS mirrors if you ever switch to an ESM build.
* `cdnjs` is another option but requires a submission/approval process.

### Tier 2 — independent copies (different companies, different failure modes)

| Mirror | URL shape | Notes |
| --- | --- | --- |
| GitHub Pages | `https://<org>.github.io/<repo>/v1.0.0/discord-transcript.min.css` | Push `dist/v1.0.0/` to the `gh-pages` branch. The build already emits that folder. |
| Statically | `https://cdn.statically.io/gh/<org>/<repo>/v1.0.0/dist/…` | Mirrors a GitHub tag. |
| raw.githack | `https://raw.githack.com/<org>/<repo>/v1.0.0/dist/…` | Serves tags with correct content types. |
| Your own domain | `https://cdn.example.com/discord-transcript/1.0.0/…` | Put the object-storage bucket behind a CDN. |

### Tier 3 — archival (survives you)

| Service | What to store | Why |
| --- | --- | --- |
| [Software Heritage](https://archive.softwareheritage.org/) | the repository, per release tag | Permanent, intrinsic identifiers; can serve the sources again. |
| [Wayback Machine](https://web.archive.org/save/) | each published CDN URL, once per release | `web.archive.org/web/2026/<original-url>` becomes a working mirror. |
| [Zenodo](https://zenodo.org/) | a release tarball | DOI-stamped, citable, permanent. |
| IPFS / Arweave | the two `.min` files | Content-addressed: the CID/hash proves the bytes. |
| A folder next to the archive | `discord-transcript.min.css` + `.min.js` beside the HTML | The ultimate fallback: no network at all. `tools/scaffold.mjs --local` already emits relative URLs for exactly this. |

## 3. The client-side fallback chain

`assets/cdn-loader.html` (~700 bytes, inlined into each transcript) walks the mirror list in
order for both the stylesheet and the script:

```js
function load(list, make) {
	var i = 0;
	(function next() {
		if (i >= list.length) return; /* every mirror failed — degrade quietly */
		var entry = list[i++];
		var node = make(entry);
		node.onerror = next;
		(document.head || document.documentElement).appendChild(node);
	})();
}
```

Design decisions worth keeping:

* **`integrity` only on npm-backed mirrors.** SRI on a cross-origin resource requires CORS;
  jsDelivr and unpkg always send it, some GitHub-derived mirrors do not. Applying SRI
  everywhere would blackhole those mirrors instead of falling back to them.
* **Failure is silent.** Exhausting the list leaves a readable, semantically complete HTML
  document — never an error page and never a blocked render (the script is `async` by
  construction, the stylesheet is non-blocking on failure).
* **Ordering:** cheapest/most reliable first, own infrastructure last, so a normal view
  never pays for a fallback.
* **No dependency on this project being reachable.** The list is a literal array in the file.

## 4. Pinning policy

* Every transcript pins the **exact version** (`@1.0.0`), never a range or `latest`.
  Byte-stability is worth more than silently receiving a CSS fix.
* A bug found after release is fixed in a **new version**; old transcripts keep the old
  bytes. If you need to repair an archive in bulk, use the migration tool below.
* Keep every published version forever. The `dist/` layout is immutable: file names never
  change, only versions accumulate.
* `npm run build:check` fails if `dist/` does not match `src/`, so CI can guarantee that a
  tag and the assets inside it agree.

## 5. The recovery comment

`tools/scaffold.mjs` stamps this into every generated file (values from `dist/manifest.json`):

```html
<!--
  discord-transcript-ui v1.0.0 — asset recovery information.
  Stylesheet : https://cdn.jsdelivr.net/npm/discord-transcript-ui@1.0.0/dist/discord-transcript.min.css
               sha256-af58b4c1…
               integrity="sha384-XUcBaPTj…"
  Script     : …
  Mirrors (same bytes, drop-in): …
  Manifest   : https://cdn.jsdelivr.net/npm/discord-transcript-ui@1.0.0/dist/manifest.json
-->
```

That comment is the difference between "the CDN died and my transcripts are unstyled" and
"someone in 2033 can find the file, verify the hash and fix it in a minute". Keep it.

## 6. Release checklist

1. Bump `version` in **both** `package.json` and `lib.config.json` (the build refuses a mismatch).
2. Replace the placeholder org/domain in `lib.config.json` (`YOUR-GITHUB-ORG`, `cdn.example.com`)
   **before the first release** — after that, editing them changes frozen URLs.
3. `npm run build` → confirm the reported sizes and `dist/manifest.json`.
4. `npm run verify` → all checks pass in headless Chrome (enhanced page, no-script page, bootstrap page).
5. `git commit`, `git tag v1.0.0`, `git push --tags`.
6. `npm publish` (with 2FA; never unpublish).
7. GitHub Release: attach `dist/discord-transcript.min.{css,js}` and `dist/manifest.json`.
8. Push `dist/v1.0.0/` to the `gh-pages` branch.
9. Upload `dist/` to your object storage at `/discord-transcript/1.0.0/`.
10. Archive: Software Heritage (tag), Wayback (`/save/` each CDN URL), Zenodo (release tarball),
    IPFS (`ipfs add` the two files, record the CID in the release notes).
11. Smoke-test one transcript with the loader. Optionally block every mirror but the last
    and confirm the transcript still renders.

## 7. What actually breaks, and when

| If this dies | Transcript effect |
| --- | --- |
| jsDelivr | Loader falls through to unpkg; a short delay at most. |
| All npm mirrors | Falls to GitHub Pages / Statically / raw.githack. |
| GitHub and npm and your domain | Falls to IPFS/Wayback — if those were seeded. Otherwise: unstyled but readable. |
| Every asset URL | Text, images, code, replies, embeds' descriptions/fields/footers and files still render. Avatars, headers and timestamps do not. |
| The project entirely, forever | The recovery comment + `manifest.json` + the archived tarball are enough to reconstruct both files. |

## 8. Recommendations, in priority order

1. **Publish to npm under a scope you will still control in ten years** and enable 2FA.
   Two independent CDNs (jsDelivr, unpkg) then come free, with SRI.
2. **Keep a copy of the two `.min` files next to your long-term archives.** Two files,
   ~47 KB total — cheaper than any CDN insurance and it removes the network entirely.
3. **Seed Wayback + Software Heritage once per release.** Minutes of work, and they are the
   only mirrors that survive you losing every account.
4. **Pin exact versions and never rename a file.** This is what makes the pinned URLs above
   meaningful.
5. **Ship the manifest.** `dist/manifest.json` lists every mirror plus hashes and sizes,
   which turns recovery into a lookup rather than archaeology.

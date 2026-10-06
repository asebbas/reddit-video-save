# Reddit Video Save

Firefox (MV3) add-on that saves Reddit-hosted (v.redd.it) videos **with audio** as a single MP4. No re-encode, no third-party services, no data collection.

Not affiliated with Reddit.

## Use
- Right-click a post link or the video player → **Save Reddit video**, or
- click the toolbar button while on a post page.

Works on old.reddit and new Reddit. Output: `{title}_{postid}.mp4` in the default Downloads folder. Silent videos are saved video-only.

## How it works
Post id (incl. `/s/` share links) → `reddit.com/comments/<id>.json` → video `fallback_url` + best audio track from the DASH MPD → stream-copy remux with [mediabunny](https://github.com/Vanilagy/mediabunny) → `downloads` API. Requests go only to `reddit.com` / `v.redd.it`, using your existing session cookies.

## Build (reproducible)
Requirements: Node >= 22 (see `.nvmrc`), npm >= 10, any OS.

```
npm ci
npm run build        # -> dist/ (unminified esbuild IIFE bundles + manifest + icons)
```
`dist/` is exactly what is packaged into the add-on. Tools used: esbuild, TypeScript (typecheck only), web-ext (lint/package), all open source and installed from the npm registry via the committed `package-lock.json`.

## Develop
```
npm run typecheck
npm run lint            # build + web-ext lint
npm run run             # launch Firefox with the add-on loaded
npm run package         # -> web-ext-artifacts/reddit_video_save-<version>.zip (upload to AMO)
npm run package:source  # -> web-ext-artifacts/source.zip (git archive of HEAD, for AMO source upload)
```
Manual load: `about:debugging` → This Firefox → Load Temporary Add-on → `dist/manifest.json`.

## Release checklist
1. Bump `version` in `manifest.json` and `package.json`.
2. `npm run lint && npm run package && npm run package:source` (commit first; `git archive` packs HEAD).
3. Upload both zips to AMO (answer **Yes** to source code submission).
4. Tag `vX.Y.Z` on GitHub.

## License
MIT (`LICENSE`). Bundles mediabunny under MPL-2.0, see `THIRD_PARTY_NOTICES.md`.

# AMO listing

**Name:** Reddit Video Save
**Add-on ID:** reddit-video-save@asebbas.github.io (permanent once published)
**License:** MIT
**Homepage / support:** https://github.com/asebbas/reddit-video-save (issues: .../issues)
**Categories (suggested):** Download Management; Photos, Music & Videos
**Tags:** reddit, video, download, v.redd.it, mp4

## Summary 
Save Reddit-hosted videos with sound as a single MP4. Right-click a post link or video, or use the toolbar button. Works on old and new Reddit. No tracking, no external services.

## Description
Reddit Video Save downloads Reddit-hosted (v.redd.it) videos with audio as one MP4 file.

**How to use**
- Right-click a post link or the video player and choose "Save Reddit video", or
- click the toolbar button while viewing a post.

**Details**
- Works on old.reddit.com and new Reddit.
- Merges Reddit's separate video and audio streams locally, without re-encoding.
- Saves to your default Downloads folder as {title}_{postid}.mp4. Videos without audio are saved video-only.
- Handles share links and crossposts of Reddit-hosted videos.
- Uses your existing Reddit session, so posts you can view are saved.
- Does not collect, store or transmit any data. Network requests go only to reddit.com and v.redd.it.
- Reddit-hosted videos only; external embeds (YouTube, RedGifs, Imgur) and galleries are not supported.

Open source (MIT): https://github.com/asebbas/reddit-video-save
Not affiliated with Reddit.

## Privacy
Data collection declared in manifest: none. No analytics, no remote code, no third-party servers.

## Notes to reviewer
- Source upload: source.zip (git archive). Build: `npm ci && npm run build`; Node >= 22; output `dist/` matches the submitted package. esbuild bundles TypeScript and the single runtime dependency (mediabunny, MPL-2.0, unmodified). Bundles are unminified.
- Permissions:
  - `*://*.reddit.com/*`, `*://v.redd.it/*`, `*://redd.it/*`: fetch the post JSON (`/comments/<id>.json`), resolve share/short links, and fetch the video/audio streams and DASH manifest.
  - `downloads`: save the muxed MP4.
  - `menus`: "Save Reddit video" context menu on links and videos.
  - `activeTab`: read the current tab URL on toolbar-button click.
  - `notifications`: show an error message when a save fails.
- Content script (`*.reddit.com`): on `contextmenu`, records the permalink of the post under the cursor and returns it to the background script on request. It reads no other page data.
- No remote code, no eval, no data leaves the browser except requests to Reddit.
- To test: open any post with a Reddit-hosted video (e.g. in r/videos or r/interestingasfuck), click the toolbar button on the post page; an MP4 is saved to Downloads.

## Screenshots 
<img width="606" height="315" alt="screenshot" src="https://github.com/user-attachments/assets/65e51838-6167-4451-9555-95990cd4e394" />


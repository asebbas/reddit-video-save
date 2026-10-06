// Tracks the post under the last right-click so the background can resolve it.
// Works on new Reddit (<shreddit-post permalink>) and old Reddit (.thing[data-permalink]).
let lastPermalink: string | null = null;

addEventListener(
  'contextmenu',
  (e) => {
    lastPermalink = null;
    for (const el of e.composedPath()) {
      if (!(el instanceof Element)) continue;
      const p =
        el.tagName.toLowerCase() === 'shreddit-post'
          ? el.getAttribute('permalink')
          : el.getAttribute('data-permalink');
      if (p) {
        lastPermalink = new URL(p, location.origin).href;
        return;
      }
    }
  },
  true,
);

browser.runtime.onMessage.addListener((msg: unknown) =>
  (msg as { type?: string })?.type === 'lastPermalink' ? Promise.resolve(lastPermalink) : undefined,
);

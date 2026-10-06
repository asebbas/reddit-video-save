import { getVideoInfo, makeFilename, resolvePostId } from './reddit';
import { mux } from './mux';

const menus = (browser as any).menus ?? (browser as any).contextMenus;
const MENU_LINK = 'rvs-link';
const MENU_VIDEO = 'rvs-video';
const REDDIT_LINKS = ['*://*.reddit.com/*', '*://v.redd.it/*', '*://redd.it/*'];

browser.runtime.onInstalled.addListener(() => {
  menus.create({
    id: MENU_LINK,
    title: 'Save Reddit video',
    contexts: ['link'],
    targetUrlPatterns: REDDIT_LINKS,
  });
  menus.create({
    id: MENU_VIDEO,
    title: 'Save Reddit video',
    contexts: ['video'],
    documentUrlPatterns: ['*://*.reddit.com/*'],
  });
});

menus.onClicked.addListener(async (info: browser.menus.OnClickData, tab?: browser.tabs.Tab) => {
  try {
    let url: string | undefined;
    if (info.menuItemId === MENU_LINK) url = info.linkUrl;
    else if (tab?.id != null) {
      url = ((await browser.tabs
        .sendMessage(tab.id, { type: 'lastPermalink' })
        .catch(() => null)) as string | null) ?? tab.url;
    }
    if (!url) throw new Error('Could not determine post');
    await save(url);
  } catch (e) {
    notify('Save failed', e);
  }
});

browser.action.onClicked.addListener(async (tab) => {
  try {
    if (!tab.url) throw new Error('No active page');
    await save(tab.url);
  } catch (e) {
    notify('Save failed', e);
  }
});

async function save(url: string) {
  // Keep the event page alive during long fetch/mux jobs.
  const keepAlive = setInterval(() => void browser.runtime.getPlatformInfo(), 20_000);
  try {
    const info = await getVideoInfo(await resolvePostId(url));
    const fetchBlob = async (u: string) => {
      const r = await fetch(u);
      if (!r.ok) throw new Error(`Fetch failed (${r.status})`);
      return r.blob();
    };
    const video = await fetchBlob(info.videoUrl);
    const out = info.audioUrl ? await mux(video, await fetchBlob(info.audioUrl)) : video;

    const blobUrl = URL.createObjectURL(out);
    const filename = makeFilename(info.title, info.id);
    const dlId = await browser.downloads.download({
      url: blobUrl,
      filename,
      saveAs: false,
      conflictAction: 'uniquify',
    });
    const onChanged = (d: browser.downloads._OnChangedDownloadDelta) => {
      if (d.id === dlId && d.state?.current && d.state.current !== 'in_progress') {
        browser.downloads.onChanged.removeListener(onChanged);
        URL.revokeObjectURL(blobUrl);
      }
    };
    browser.downloads.onChanged.addListener(onChanged);
  } finally {
    clearInterval(keepAlive);
  }
}

function notify(title: string, e: unknown) {
  void browser.notifications.create({
    type: 'basic',
    title,
    message: e instanceof Error ? e.message : String(e),
    iconUrl: 'icons/icon.svg',
  });
}

export interface VideoInfo {
  id: string;
  title: string;
  videoUrl: string;
  audioUrl: string | null;
}

const COMMENTS_RE = /\/comments\/([a-z0-9]+)/i;

/** Resolve any supported Reddit URL (post, /s/ share link, redd.it, v.redd.it) to a post id. */
export async function resolvePostId(url: string): Promise<string> {
  const direct = COMMENTS_RE.exec(new URL(url).pathname);
  if (direct) return direct[1];
  // Share links, short links etc: follow redirects and inspect the final URL.
  const res = await fetch(url, { credentials: 'include', redirect: 'follow' });
  void res.body?.cancel();
  const m = COMMENTS_RE.exec(new URL(res.url).pathname);
  if (!m) throw new Error('Not a Reddit post URL');
  return m[1];
}

interface RedditVideo {
  fallback_url?: string;
  dash_url?: string;
}

export async function getVideoInfo(postId: string): Promise<VideoInfo> {
  const res = await fetch(`https://www.reddit.com/comments/${postId}.json?raw_json=1`, {
    credentials: 'include',
  });
  if (!res.ok) throw new Error(`Reddit API returned ${res.status}`);
  const json = await res.json();
  const post = json?.[0]?.data?.children?.[0]?.data;
  if (!post) throw new Error('Post not found');

  const pick = (p: any): RedditVideo | undefined =>
    p?.secure_media?.reddit_video ?? p?.media?.reddit_video;
  const rv = pick(post) ?? pick(post.crosspost_parent_list?.[0]);
  if (!rv?.fallback_url) throw new Error('No Reddit-hosted video in this post');

  const videoUrl = rv.fallback_url;
  const audioUrl = await findAudio(rv.dash_url, videoUrl);
  return { id: post.id, title: post.title ?? post.id, videoUrl, audioUrl };
}

async function findAudio(dashUrl: string | undefined, videoUrl: string): Promise<string | null> {
  if (dashUrl) {
    try {
      const res = await fetch(dashUrl);
      if (res.ok) {
        const doc = new DOMParser().parseFromString(await res.text(), 'text/xml');
        let best: { bw: number; url: string } | null = null;
        for (const set of doc.querySelectorAll('AdaptationSet')) {
          const isAudio =
            set.getAttribute('contentType') === 'audio' ||
            set.getAttribute('mimeType')?.startsWith('audio') ||
            set.querySelector('Representation')?.getAttribute('mimeType')?.startsWith('audio');
          if (!isAudio) continue;
          for (const rep of set.querySelectorAll('Representation')) {
            const base = rep.querySelector('BaseURL')?.textContent?.trim();
            if (!base) continue;
            const bw = Number(rep.getAttribute('bandwidth') ?? 0);
            if (!best || bw > best.bw) best = { bw, url: new URL(base, dashUrl).href };
          }
        }
        // MPD parsed fine: trust it (no audio set => silent video).
        return best?.url ?? null;
      }
    } catch {
      /* fall through to probing */
    }
  }
  // Fallback: probe well-known audio names.
  const base = videoUrl.slice(0, videoUrl.lastIndexOf('/') + 1);
  for (const name of ['DASH_AUDIO_128.mp4', 'DASH_audio.mp4', 'DASH_AUDIO_64.mp4']) {
    try {
      const r = await fetch(base + name, { method: 'HEAD' });
      if (r.ok) return base + name;
    } catch {
      /* next */
    }
  }
  return null;
}

/** Filesystem-safe `{title}_{postid}.mp4`. */
export function makeFilename(title: string, id: string): string {
  const clean = title
    .replace(/[\\/:*?"<>|\u0000-\u001f]/g, '')
    .replace(/\s+/g, '_')
    .replace(/^[._]+|[._]+$/g, '')
    .slice(0, 100)
    .replace(/_+$/, '');
  return `${clean || 'reddit_video'}_${id}.mp4`;
}

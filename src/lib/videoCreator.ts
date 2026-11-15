import type { Platform } from '@/lib/video'
import type { Fetcher } from '@/lib/videoCover'

// SEO day 13: Search Console flagged every VideoObject on /videos with "Missing field 'url' (in
// 'creator')". The creator's own channel or account page fills it, and the card links the name to it.

const HOSTS: Record<Platform, string> = { youtube: 'youtube.com', instagram: 'instagram.com', tiktok: 'tiktok.com' }
const UA = { 'User-Agent': 'Mozilla/5.0 (compatible; SyriaUpClose/1.0; +https://www.upclosesyria.com)' }

const hostOf = (raw: string): string | null => {
  try {
    const u = new URL(raw)
    return u.protocol === 'https:' ? u.hostname.toLowerCase().replace(/^(www\.|m\.)/, '') : null
  } catch {
    return null
  }
}

/** A creator page on one of the three platforms (on the video's own platform when it is given). */
export function isCreatorUrl(raw: unknown, platform?: Platform | null): raw is string {
  if (typeof raw !== 'string' || !raw.trim()) return false
  const h = hostOf(raw.trim())
  return h != null && (platform ? h === HOSTS[platform] : Object.values(HOSTS).includes(h))
}

/** Payload validation: empty is fine (filled on save where the platform says), otherwise a platform page. */
export function creatorUrlError(raw: unknown): true | string {
  if (raw == null || raw === '' || isCreatorUrl(raw)) return true
  return 'الصق رابط قناة أو حساب صاحب المقطع على يوتيوب أو إنستغرام أو تيك توك (يبدأ بـ https://).'
}

/**
 * The creator's page as the platform's oEmbed names it (author_url). YouTube and TikTok publish it without
 * a key; Instagram's oEmbed needs an app token, so its creators are entered by hand. Null on any doubt.
 */
export async function fetchCreatorUrl(v: { platform: Platform; url: string }, fetcher: Fetcher = fetch): Promise<string | null> {
  const endpoint =
    v.platform === 'youtube'
      ? `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(v.url)}`
      : v.platform === 'tiktok'
        ? `https://www.tiktok.com/oembed?url=${encodeURIComponent(v.url)}`
        : null
  if (!endpoint) return null
  const res = await fetcher(endpoint, { headers: UA })
  if (!res.ok) return null
  const body = (await res.json().catch(() => null)) as { author_url?: unknown } | null
  const found = body?.author_url
  return isCreatorUrl(found, v.platform) ? found.trim() : null
}

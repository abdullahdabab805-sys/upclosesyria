// RSS 2.0 feeds (SEO day 9): what is new in the guide, for feed readers, aggregators and search engines
// (Google accepts RSS 2.0 as a sitemap). Built from the guide index (data/guide), so a feed lists only
// published, indexable pages, never a draft, a noindex page or an English URL of an Arabic-only section.
// An item carries the page's own name and one-line note, never the page's full text, and no image
// (Google reads feeds for pages and video only).
import { indexablePaths } from '@/lib/seo'
import type { LlmsInfo } from '@/lib/llms'
import type { SitemapPage } from '@/lib/sitemap'
import { BRAND } from '@/lib/brand'

export const FEED_LIMIT = 30

export const FEEDS = {
  seasons: { path: '/feeds/seasons.xml', lang: 'ar', title: `تقارير الموسم · ${BRAND.ar}`, description: 'تقارير ميدانية مؤرخة من مراسلين على الأرض، الأحدث أولاً.' },
  updates: { path: '/feeds/updates.xml', lang: 'ar', title: `جديد ${BRAND.ar}`, description: 'صفحات الدليل التي نُشرت أو حُدّثت مؤخراً، الأحدث أولاً.' },
  'updates-en': { path: '/feeds/updates-en.xml', lang: 'en', title: `${BRAND.en}: what's new`, description: 'Guide pages published or updated recently, newest first.' },
} as const

export type FeedName = keyof typeof FEEDS
export const isFeedName = (v: string): v is FeedName => Object.hasOwn(FEEDS, v)

export type FeedItem = { title: string; path: string; date: string; description?: string }

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;')
const clean = (s: string) => s.replace(/\s+/g, ' ').trim()
const time = (d: string) => new Date(d).getTime()
/** RFC 822 date, as RSS 2.0 requires ("Mon, 09 Nov 2026 00:00:00 GMT"). */
const rfc822 = (d: string) => new Date(d).toUTCString()

/** Newest first, valid dates only, at most FEED_LIMIT. */
export function newest(items: FeedItem[], limit = FEED_LIMIT): FeedItem[] {
  return items.filter((i) => !Number.isNaN(time(i.date))).sort((a, b) => time(b.date) - time(a.date)).slice(0, limit)
}

/**
 * The feed's items from one or more guide sections. Arabic feeds link each page's Arabic URL with its
 * Arabic name and note; the English feed takes only pages with an indexable English URL and an English
 * name, without the (Arabic) note. `date` picks the item date: the page's lastmod, or its own date.
 */
export function feedItems(
  sections: { pages: readonly SitemapPage[]; info: (path: string) => LlmsInfo | undefined }[],
  lang: 'ar' | 'en',
  date: (page: SitemapPage, info: LlmsInfo) => string | undefined = (p) => p.lastmod,
): FeedItem[] {
  return sections.flatMap((s) =>
    s.pages.flatMap((p) => {
      const info = s.info(p.path)
      const when = info && date(p, info)
      if (!info?.name || !when) return []
      const [ar, en] = indexablePaths(p.path, p.translated ?? true)
      if (lang === 'en') return en && info.en ? [{ title: info.en, path: en, date: when }] : []
      return ar ? [{ title: info.name, path: ar, date: when, ...(info.note ? { description: clean(info.note) } : {}) }] : []
    }),
  )
}

export function rssXml(o: { base: string; feed: FeedName; items: FeedItem[] }): string {
  const f = FEEDS[o.feed]
  const items = newest(o.items)
  const home = `${o.base}${f.lang === 'en' ? '/en' : '/'}`
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    '<channel>',
    `<title>${esc(f.title)}</title>`,
    `<link>${esc(home)}</link>`,
    `<description>${esc(f.description)}</description>`,
    `<language>${f.lang}</language>`,
    `<atom:link href="${esc(o.base + f.path)}" rel="self" type="application/rss+xml"/>`,
    ...(items[0] ? [`<lastBuildDate>${rfc822(items[0].date)}</lastBuildDate>`] : []),
    ...items.map((i) =>
      [
        '<item>',
        `<title>${esc(i.title)}</title>`,
        `<link>${esc(o.base + i.path)}</link>`,
        `<guid isPermaLink="true">${esc(o.base + i.path)}</guid>`,
        `<pubDate>${rfc822(i.date)}</pubDate>`,
        ...(i.description ? [`<description>${esc(i.description)}</description>`] : []),
        '</item>',
      ].join(''),
    ),
    '</channel>',
    '</rss>',
    '',
  ].join('\n')
}

export const RSS_HEADERS = { 'Content-Type': 'application/rss+xml; charset=utf-8', 'Cache-Control': 'public, max-age=3600, s-maxage=3600' }

/** The feeds a page in this language links to from its <head> (alternates.types). */
export function feedLinks(base: string, lang: 'ar' | 'en'): { url: string; title: string }[] {
  return (Object.values(FEEDS) as (typeof FEEDS)[FeedName][]).filter((f) => f.lang === lang).map((f) => ({ url: `${base}${f.path}`, title: f.title }))
}

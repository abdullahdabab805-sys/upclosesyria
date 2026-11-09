import { describe, expect, it } from 'vitest'
import { FEED_LIMIT, feedItems, feedLinks, FEEDS, isFeedName, newest, rssXml } from '@/lib/feeds'
import type { LlmsInfo } from '@/lib/llms'

const section = (pages: { path: string; translated?: boolean; lastmod?: string }[], info: Record<string, LlmsInfo>) => ({ pages, info: (p: string) => info[p] })

describe('RSS feeds (SEO day 9)', () => {
  it('knows its three feeds and nothing else', () => {
    expect(Object.keys(FEEDS)).toEqual(['seasons', 'updates', 'updates-en'])
    expect(isFeedName('updates')).toBe(true)
    expect(isFeedName('toString')).toBe(false)
  })

  it('Arabic feed: Arabic URL, name and note; pages without a name or a date are skipped', () => {
    const s = section(
      [
        { path: '/cities/damascus', lastmod: '2026-11-01' },
        { path: '/cities/nameless', lastmod: '2026-11-02' },
        { path: '/cities/undated' },
      ],
      { '/cities/damascus': { name: 'دمشق', en: 'Damascus', note: '  أقدم   عاصمة ' }, '/cities/undated': { name: 'مدينة' } },
    )
    expect(feedItems([s], 'ar')).toEqual([{ title: 'دمشق', path: '/cities/damascus', date: '2026-11-01', description: 'أقدم عاصمة' }])
  })

  it('English feed: only pages with an indexable English URL and an English name, never an Arabic-only section', () => {
    const s = section(
      [
        { path: '/cities/damascus', lastmod: '2026-11-01' },
        { path: '/outside/first-visit/visa', translated: false, lastmod: '2026-11-03' },
        { path: '/inside/bloudan', lastmod: '2026-11-04' },
        { path: '/seasons/hama', lastmod: '2026-11-05' },
      ],
      {
        '/cities/damascus': { name: 'دمشق', en: 'Damascus', note: 'نص عربي' },
        '/outside/first-visit/visa': { name: 'الفيزا', en: 'Visa' },
        '/inside/bloudan': { name: 'بلودان', en: 'Bloudan' },
        '/seasons/hama': { name: 'حماة', en: 'Hama' },
      },
    )
    expect(feedItems([s], 'en')).toEqual([{ title: 'Damascus', path: '/en/cities/damascus', date: '2026-11-01' }])
  })

  it('season reports use their own field date, not the lastmod', () => {
    const s = section([{ path: '/seasons/hama', lastmod: '2026-11-08' }], { '/seasons/hama': { name: 'حماة', date: '2026-10-21', note: 'تقرير ميداني' } })
    expect(feedItems([s], 'ar', (_p, i) => i.date)[0]?.date).toBe('2026-10-21')
  })

  it('newest first, invalid dates dropped, capped at the limit', () => {
    const items = Array.from({ length: FEED_LIMIT + 5 }, (_, i) => ({ title: `t${i}`, path: `/p${i}`, date: `2026-01-${String((i % 28) + 1).padStart(2, '0')}` }))
    const out = newest([...items, { title: 'bad', path: '/bad', date: 'not a date' }])
    expect(out).toHaveLength(FEED_LIMIT)
    expect(out.map((i) => i.title)).not.toContain('bad')
    expect(out[0]?.date).toBe('2026-01-28')
  })

  it('valid RSS 2.0: escaped text, absolute links, permalink guid, RFC 822 dates, self link', () => {
    const xml = rssXml({
      base: 'https://x.org',
      feed: 'updates',
      items: [
        { title: 'حلب & <ريفها>', path: '/cities/aleppo', date: '2026-11-02', description: 'قال "أهلاً"' },
        { title: 'دمشق', path: '/cities/damascus', date: '2026-11-05' },
      ],
    })
    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0"')).toBe(true)
    expect(xml).toContain('<atom:link href="https://x.org/feeds/updates.xml" rel="self" type="application/rss+xml"/>')
    expect(xml).toContain('<language>ar</language>')
    expect(xml).toContain('<title>حلب &amp; &lt;ريفها&gt;</title>')
    expect(xml).toContain('<description>قال &quot;أهلاً&quot;</description>')
    expect(xml).toContain('<guid isPermaLink="true">https://x.org/cities/aleppo</guid>')
    expect(xml).toContain('<lastBuildDate>Thu, 05 Nov 2026 00:00:00 GMT</lastBuildDate>')
    expect(xml.indexOf('/cities/damascus')).toBeLessThan(xml.indexOf('/cities/aleppo'))
    expect(xml).not.toMatch(/<enclosure|<img/)
  })

  it('an empty feed is still valid and has no lastBuildDate', () => {
    const xml = rssXml({ base: 'https://x.org', feed: 'seasons', items: [] })
    expect(xml).toContain('<channel>')
    expect(xml).not.toContain('<item>')
    expect(xml).not.toContain('lastBuildDate')
  })

  it('the English feed links to the English home', () => {
    expect(rssXml({ base: 'https://x.org', feed: 'updates-en', items: [] })).toContain('<link>https://x.org/en</link>')
  })

  it('pages link only the feeds in their own language', () => {
    expect(feedLinks('', 'ar').map((f) => f.url)).toEqual(['/feeds/seasons.xml', '/feeds/updates.xml'])
    expect(feedLinks('', 'en').map((f) => f.url)).toEqual(['/feeds/updates-en.xml'])
  })

  it('feed titles and descriptions make no price, safety or "official" claims', () => {
    const all = Object.values(FEEDS)
      .map((f) => `${f.title} ${f.description}`)
      .join(' ')
    expect(all).not.toMatch(/رسمي|official|آمن|أمان|safe|سعر|أسعار|price|\$/i)
  })
})

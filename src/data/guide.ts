import { cache } from 'react'
import { getDayTrips, getFirstVisitPages, getLatestReports, getMainCities } from '@/data/queries'
import { getSitemapSnapshot } from '@/data/sitemap'
import { text } from '@/lib/localized'
import type { LlmsInfo } from '@/lib/llms'
import { tripPath } from '@/lib/rural'
import { sectionPages, type SitemapPage, type SitemapSection } from '@/lib/sitemap'
import { formatDate } from '@/components/Stamp'

// The guide's named pages, by section, for llms.txt (SEO day 5) and the RSS feeds (SEO day 9).
// The page list is the sitemap's (published and indexable only), in the guide's own order (cities by
// their order field, reports newest first); names and one-line notes are each page's own text.

export type GuideSection = { pages: SitemapPage[]; info: (path: string) => LlmsInfo | undefined }
export type GuideIndex = { cities: GuideSection; trips: GuideSection; firstVisit: GuideSection; seasons: GuideSection }

/** The one-line note under a season report: its field date and, when known, who wrote it. */
export const reportNote = (fieldDate: string, authorName?: string | null) =>
  `تقرير ميداني بتاريخ ${formatDate(new Date(fieldDate), 'ar')}${authorName ? `، كتبه ${authorName}` : ''}`

export const getGuideIndex = cache(async (): Promise<GuideIndex> => {
  const [snap, cities, trips, firstVisit, reports] = await Promise.all([getSitemapSnapshot(), getMainCities(), getDayTrips(), getFirstVisitPages(), getLatestReports(200)])
  const byPath = <T,>(rows: T[], path: (r: T) => string, info: (r: T) => LlmsInfo) => {
    const m = new Map(rows.map((r) => [path(r), info(r)]))
    return (p: string) => m.get(p)
  }
  const ordered = <T,>(section: SitemapSection, rows: T[], path: (r: T) => string) => {
    const at = new Map(rows.map((r, i) => [path(r), i]))
    return [...sectionPages(section, snap)].sort((a, b) => (at.get(a.path) ?? 1e9) - (at.get(b.path) ?? 1e9))
  }
  const cityPath = (c: (typeof cities)[number]) => `/cities/${c.slug}`
  const fvPath = (p: (typeof firstVisit)[number]) => `/outside/first-visit/${p.topic}`
  const reportPath = (r: (typeof reports)[number]) => `/seasons/${r.slug}`
  return {
    cities: {
      pages: ordered('cities', cities, cityPath),
      info: byPath(cities, cityPath, (c) => ({ name: text(c.name, 'ar') ?? c.slug, en: text(c.name, 'en') ?? undefined, note: text(c.lede, 'ar') })),
    },
    trips: { pages: ordered('countryside', trips, tripPath), info: byPath(trips, tripPath, (t) => ({ name: t.title, note: t.description })) },
    firstVisit: {
      pages: ordered('first-visit', firstVisit, fvPath),
      info: byPath(firstVisit, fvPath, (p) => ({ name: text(p.title, 'ar') ?? p.topic, en: text(p.title, 'en') ?? undefined, note: text(p.summary, 'ar') })),
    },
    seasons: {
      pages: ordered('seasons', reports, reportPath),
      info: byPath(reports, reportPath, (r) => ({ name: r.title, note: reportNote(r.fieldDate, r.authorName), date: r.fieldDate })),
    },
  }
})

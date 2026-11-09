import { getGuideIndex } from '@/data/guide'
import { feedItems, FEEDS, isFeedName, RSS_HEADERS, rssXml } from '@/lib/feeds'
import { siteUrl } from '@/lib/site-url'

// RSS 2.0 feeds (SEO day 9): /feeds/seasons.xml (season reports by field date, Arabic only),
// /feeds/updates.xml and /feeds/updates-en.xml (guide pages by their sitemap lastmod).
// Rebuilt hourly, and at once on every publish (hooks/revalidate).
export const revalidate = 3600
export const dynamicParams = false

export function generateStaticParams() {
  return Object.keys(FEEDS).map((name) => ({ file: `${name}.xml` }))
}

export async function GET(_req: Request, { params }: { params: Promise<{ file: string }> }) {
  const name = (await params).file.replace(/\.xml$/, '')
  if (!isFeedName(name)) return new Response('Not found', { status: 404 })
  const g = await getGuideIndex()
  const items =
    name === 'seasons'
      ? feedItems([g.seasons], 'ar', (_p, info) => info.date)
      : feedItems([g.cities, g.trips, g.firstVisit, g.seasons], name === 'updates-en' ? 'en' : 'ar')
  return new Response(rssXml({ base: siteUrl(), feed: name, items }), { headers: RSS_HEADERS })
}

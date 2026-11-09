import { getGuideIndex } from '@/data/guide'
import { llmsLinks, llmsTxt } from '@/lib/llms'
import { siteUrl } from '@/lib/site-url'

// /llms.txt: a Markdown map of the guide for AI assistants (llmstxt.org). The page list is the
// sitemap's (published and indexable only); names and summaries are each page's own text (data/guide).
// Rebuilt hourly, and at once on every publish (hooks/revalidate).
export const revalidate = 3600

export async function GET() {
  const g = await getGuideIndex()
  const body = llmsTxt({
    base: siteUrl(),
    cities: llmsLinks(g.cities.pages, g.cities.info),
    trips: llmsLinks(g.trips.pages, g.trips.info),
    firstVisit: llmsLinks(g.firstVisit.pages, g.firstVisit.info),
    seasons: llmsLinks(g.seasons.pages, g.seasons.info),
  })
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=3600, s-maxage=3600' } })
}

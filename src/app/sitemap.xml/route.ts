import { getSitemapSnapshot } from '@/data/sitemap'
import { indexSections, sitemapIndexXml, XML_HEADERS } from '@/lib/sitemap'
import { siteUrl } from '@/lib/site-url'

// The sitemap index, at the address already submitted to Search Console and Bing (/sitemap.xml).
// Next's generateSitemaps writes no index (Next 16 docs), so this route serves it. Regenerated hourly
// and on every publish (hooks/revalidate).
export const revalidate = 3600

export async function GET() {
  const snap = await getSitemapSnapshot()
  return new Response(sitemapIndexXml(siteUrl(), indexSections(snap)), { headers: XML_HEADERS })
}

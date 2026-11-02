import { notFound } from 'next/navigation'
import { text } from '@/lib/localized'
import { asDoc, getReport } from '@/data/queries'
import { ogAlt, ogCard, pickCover } from '@/og/cover'
import { OG_CACHE, OG_SIZE } from '@/og/render'

type Params = { slug: string }

async function load({ slug }: Params) {
  const report = await getReport(slug) // published only
  if (!report) return null
  // The report's first photo, as on its page (seasons/[slug]/page).
  return { report, cover: pickCover(report.photos?.[0], [], 'ar') }
}

/** One card per page; its alt is what the photo shows (SEO day 6). */
export async function generateImageMetadata({ params }: { params: Params }) {
  const d = await load(params)
  return [{ id: 'card', size: OG_SIZE, contentType: 'image/jpeg', alt: d ? ogAlt(d.cover, `تقرير موسم · ${d.report.title}`) : 'تقرير موسم · سوريا عن قرب' }]
}

export default async function Image({ params }: { params: Promise<Params> }) {
  const d = await load(await params)
  if (!d) notFound()
  const city = asDoc(d.report.city)
  const img = await ogCard(d.cover, {
    kicker: city ? `تقرير موسم · ${text(city.name, 'ar')}` : 'تقرير موسم',
    title: d.report.title,
    subtitle: d.report.authorName ? `كتبه: ${d.report.authorName}` : undefined,
  })
  return new Response(new Uint8Array(img), { headers: { 'Content-Type': 'image/jpeg', 'Cache-Control': OG_CACHE } })
}

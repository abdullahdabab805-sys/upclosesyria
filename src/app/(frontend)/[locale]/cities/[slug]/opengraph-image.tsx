import { notFound } from 'next/navigation'
import { text } from '@/lib/localized'
import { getCity } from '@/data/queries'
import { isLocale, type Locale } from '@/lib/i18n'
import { GUIDE } from '@/content/guide'
import { ogAlt, ogCard, pickCover } from '@/og/cover'
import { OG_CACHE, OG_SIZE } from '@/og/render'

type Params = { locale: string; slug: string }

async function load({ locale, slug }: Params) {
  const city = isLocale(locale) ? await getCity(slug) : null
  if (!city || !isLocale(locale)) return null
  const l: Locale = locale
  const name = text(city.name, l) ?? slug
  // The page's top photo: the correspondent's cover, else the guide's first photo (cities/[slug]/page).
  return { l, name, city, cover: pickCover(city.coverImage, [GUIDE[slug]?.gallery[0]], l) }
}

/** One card per page; its alt is what the photo shows (SEO day 6), so it cannot be a static export. */
export async function generateImageMetadata({ params }: { params: Params }) {
  const d = await load(params)
  return [{ id: 'card', size: OG_SIZE, contentType: 'image/jpeg', alt: d ? ogAlt(d.cover, d.name) : 'سوريا عن قرب' }]
}

export default async function Image({ params }: { params: Promise<Params> }) {
  const d = await load(await params)
  if (!d) notFound()
  const img = await ogCard(d.cover, {
    kicker: d.l === 'en' ? 'Cities' : 'المدن',
    title: d.name,
    subtitle: text(d.city.lede, d.l) ?? text(d.city.tag, d.l) ?? undefined,
  })
  return new Response(new Uint8Array(img), { headers: { 'Content-Type': 'image/jpeg', 'Cache-Control': OG_CACHE } })
}

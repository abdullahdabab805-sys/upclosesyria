import { notFound } from 'next/navigation'
import { text } from '@/lib/localized'
import { asDoc, getTrip, type CityDoc } from '@/data/queries'
import { parseTripKey, tripPhotoKeys } from '@/lib/rural'
import { GUIDE } from '@/content/guide'
import { ogAlt, ogCard, pickCover } from '@/og/cover'
import { OG_CACHE, OG_SIZE } from '@/og/render'
import { BRAND } from '@/lib/brand'

type Params = { locale: string; slug: string }

async function load({ slug }: Params) {
  const key = parseTripKey(slug)
  const trip = key ? await getTrip(key) : null
  if (!trip) return null
  const place: CityDoc | null = asDoc(trip.place) ?? null
  // Same order as the page's top photo (inside/[slug]/page): the place's cover, its guide photo, the trip's photos.
  return { trip, cover: pickCover(place?.coverImage, [place ? GUIDE[place.slug]?.gallery[0] : null, ...tripPhotoKeys(trip)], 'ar') }
}

/** One card per page; its alt is what the photo shows (SEO day 6). */
export async function generateImageMetadata({ params }: { params: Params }) {
  const d = await load(params)
  return [{ id: 'card', size: OG_SIZE, contentType: 'image/jpeg', alt: d ? ogAlt(d.cover, d.trip.title) : BRAND.ar }]
}

/** A countryside page's card: its photo, or its name, its city's countryside and one-line description. */
export default async function Image({ params }: { params: Promise<Params> }) {
  const d = await load(await params)
  if (!d) notFound()
  const from = asDoc(d.trip.fromCity)
  const img = await ogCard(d.cover, {
    kicker: from ? `ريف ${text(from.name, 'ar') ?? from.slug}` : 'جوّا سوريا',
    title: d.trip.title,
    subtitle: d.trip.description ?? undefined,
  })
  return new Response(new Uint8Array(img), { headers: { 'Content-Type': 'image/jpeg', 'Cache-Control': OG_CACHE } })
}

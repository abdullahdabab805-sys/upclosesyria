import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { SyrianFill } from '@/components/Patterns'
import { Page } from '@/components/Header'
import { ArabicOnly } from '@/components/ArabicOnly'
import { Crumbs, JsonLd, Photo, ReportList, text } from '@/components/content'
import { staticPhoto } from '@/content/photos'
import { asDoc, getCity, getDayTrips, getLatestReports, getNearbyHubs, type CityDoc, type DayTripDoc, type ReportDoc } from '@/data/queries'
import { collectionPageLd, siteBase } from '@/lib/jsonld'
import { isLocale } from '@/lib/i18n'
import { cleanIntro, nearbyPath, parseNearbySlug } from '@/lib/nearby'
import { tripPath } from '@/lib/rural'
import { localePath } from '@/lib/routing'
import { latest } from '@/lib/sitemap'
import { pageMetadata } from '@/lib/seo'
import { nearbyMeta } from '@/lib/seoText'

// "Trips near a city" (SEO day 8): one page per main city for the intent "مشاوير قريبة من <city>".
// Arabic only, like all of /inside. Built only from existing records; the intro is an editor's text.
// Indexed only when lib/nearby says so; otherwise noindex and unlinked (but reachable for the editors).
export const revalidate = 3600

type Props = { params: Promise<{ locale: string; city: string }> }

export async function generateStaticParams() {
  return (await getNearbyHubs()).map((h) => ({ city: h.slug }))
}

async function load(slug: string) {
  const key = parseNearbySlug(slug)
  const city = key ? await getCity(key) : null
  if (!city || city.parentCity != null) return null
  const [hubs, allTrips, allReports] = await Promise.all([getNearbyHubs(), getDayTrips(), getLatestReports(100)])
  const hub = hubs.find((h) => h.cityId === city.id)
  if (!hub) return null
  const trips = allTrips.filter((t) => asDoc(t.fromCity)?.id === city.id)
  // Reports from the city or a place in its countryside, newest first (as on the city page).
  const reports = allReports.filter((r) => {
    const c = asDoc(r.city)
    return c != null && (c.id === city.id || (asDoc(c.parentCity)?.id ?? c.parentCity) === city.id)
  })
  return { city, hub, trips, reports: reports.slice(0, 6) }
}

const facts = (city: CityDoc, trips: DayTripDoc[], reports: ReportDoc[]) =>
  nearbyMeta({
    cityName: text(city.name, 'ar') ?? city.slug,
    intro: cleanIntro(city.nearbyIntro),
    trips: trips.length,
    kinds: trips.flatMap((t) => (t.tag ? [t.tag] : [])),
    withDistance: trips.filter((t) => t.distanceNote).length,
    reports: reports.length,
  })

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, city: slug } = await params
  const data = isLocale(locale) ? await load(slug) : null
  if (!data || !isLocale(locale)) return {}
  const { title, description } = facts(data.city, data.trips, data.reports)
  return pageMetadata({
    locale,
    path: nearbyPath(data.city.slug),
    title,
    description,
    arabicOnly: true,
    // Under the threshold or without an editor's intro: reachable, never indexed (lib/nearby).
    noindex: !data.hub.indexable,
  })
}

export default async function NearbyPage({ params }: Props) {
  const { locale, city: slug } = await params
  if (!isLocale(locale)) notFound()
  const data = await load(slug)
  if (!data) notFound()
  const { city, hub, trips, reports } = data
  const name = text(city.name, 'ar') ?? city.slug
  const intro = cleanIntro(city.nearbyIntro)
  const meta = facts(city, trips, reports)
  const path = nearbyPath(city.slug)
  const cityPath = localePath('ar', `/cities/${city.slug}`)
  let n = 0
  const num = () => String(++n).padStart(2, '0')

  return (
    <Page locale={locale} path={path}>
      {hub.indexable && locale === 'ar' && <JsonLd data={collectionPageLd({ base: siteBase(), path, locale: 'ar', name: meta.title, description: meta.description, dateModified: latest(...trips.map((t) => latest(t.updatedAt, t.checkedAt))) ?? null })} />}
      <ArabicOnly locale={locale}>
        <section className="dark band2">
          <SyrianFill id="khatam" opacity={0.1} />
          <div className="wrap page-hero" style={{ paddingTop: 56, paddingBottom: 56 }}>
            <Crumbs items={[{ href: '/inside', label: 'جوّا سوريا' }, { href: cityPath, label: name }, { label: `مشاوير قريبة من ${name}` }]} />
            <span className="eyebrow rise">للي عايشين بسوريا · عربي فقط</span>
            <h1 className="big rise2">مشاوير قريبة من {name}</h1>
            {intro ? (
              <p className="lede rise3" style={{ fontSize: 19, maxWidth: 680 }}>
                {intro}
              </p>
            ) : (
              // No generated text: until an editor writes the intro the page says only what it is (and stays noindex).
              <p className="lede rise3" style={{ fontSize: 19, maxWidth: 680 }}>
                {trips.length} مشوار من {name}، مرتّبة متل ما رتّبها المحررون.
              </p>
            )}
          </div>
        </section>

        <section className="sec trips">
          <div className="wrap">
            <div className="sec-head" style={{ marginTop: 24, marginBottom: 8 }}>
              <h2>المشاوير من {name}</h2>
              <span className="more" style={{ color: 'var(--ink2)', fontWeight: 400 }}>
                {trips.length} مشوار
              </span>
            </div>
            <div className="cards">
              {trips.map((t) => (
                <Link className="pcard lift" key={t.id} href={tripPath(t)}>
                  {staticPhoto(`trip-${t.title}`) ? (
                    <span className="media short">
                      <Photo shot={t.title} fallback={`trip-${t.title}`} />
                      <span className="num">{num()}</span>
                    </span>
                  ) : (
                    <span className="trip-num">{num()}</span>
                  )}
                  <span className="body">
                    {(t.tag || t.distanceNote) && <span className="meta">{[t.tag, t.distanceNote].filter(Boolean).join(' · ')}</span>}
                    <h3 className="title">{t.title}</h3>
                    {t.description && <p style={{ fontSize: 15 }}>{t.description}</p>}
                    <span className="go">افتح صفحة المكان ←</span>
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {reports.length > 0 && (
          <section className="sec alt">
            <div className="wrap" style={{ paddingBlock: 24 }}>
              <div className="sec-head">
                <div>
                  <span className="eyebrow">تقارير الموسم</span>
                  <h2>شو صاير بالمنطقة هلق؟</h2>
                  <p>آخر التقارير الميدانية من {name} وريفها، كل تقرير بتاريخه.</p>
                </div>
                <Link className="more" href="/seasons">
                  كل تقارير الموسم ←
                </Link>
              </div>
              <ReportList reports={reports} locale="ar" />
            </div>
          </section>
        )}

        <section className="sec">
          <div className="wrap" style={{ paddingBlock: 24 }}>
            <p className="copy">
              بدك تعرف المدينة نفسها؟{' '}
              <Link href={cityPath}>صفحة {name}: حال البلد اليوم، المعالم، والأكل</Link>. وكل المشاوير من كل المدن على <Link href="/inside">صفحة جوّا سوريا</Link>.
            </p>
          </div>
        </section>
      </ArabicOnly>
    </Page>
  )
}

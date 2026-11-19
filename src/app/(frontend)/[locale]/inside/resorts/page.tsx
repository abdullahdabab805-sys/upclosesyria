import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { SyrianFill, MuqarnasEdge } from '@/components/Patterns'
import { Page } from '@/components/Header'
import { ArabicOnly } from '@/components/ArabicOnly'
import { Crumbs, JsonLd, Photo, text } from '@/components/content'
import { staticPhoto } from '@/content/photos'
import { asDoc, getDayTrips, getNearbyHubs, getResortsHub, getSettings, type DayTripDoc } from '@/data/queries'
import { collectionPageLd, siteBase } from '@/lib/jsonld'
import { isLocale } from '@/lib/i18n'
import { cleanIntro } from '@/lib/nearby'
import { RESORTS_PATH, RESORTS_TOPIC, resortTrips } from '@/lib/resorts'
import { tripPath } from '@/lib/rural'
import { localePath } from '@/lib/routing'
import { latest } from '@/lib/sitemap'
import { pageMetadata } from '@/lib/seo'
import { resortsMeta } from '@/lib/seoText'

// "Syria's summer resorts" (SEO day 19): one page for the intent "أجمل مصايف سوريا". Arabic only, like
// all of /inside. Built only from the trips an editor tagged "مصيف"; the intro is an editor's text.
// Indexed only when lib/resorts says so; otherwise noindex and unlinked (but reachable for the editors).
export const revalidate = 3600

async function load() {
  const [trips, settings, hub] = await Promise.all([getDayTrips(), getSettings(), getResortsHub()])
  const resorts = resortTrips(trips)
  const cityName = (t: DayTripDoc) => {
    const c = asDoc(t.fromCity)
    return c ? (text(c.name, 'ar') ?? c.slug) : null
  }
  const meta = resortsMeta({ intro: cleanIntro(settings.resortsIntro), names: resorts.map((t) => t.title), fromCities: resorts.flatMap((t) => cityName(t) ?? []) })
  return { resorts, intro: cleanIntro(settings.resortsIntro), hub, meta, cityName }
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  if (!isLocale(locale)) return {}
  const { hub, meta } = await load()
  return pageMetadata({
    locale,
    path: RESORTS_PATH,
    title: meta.title,
    description: meta.description,
    arabicOnly: true,
    // Too few resorts or no editor's intro: reachable, never indexed (lib/resorts).
    noindex: !hub.indexable,
  })
}

export default async function ResortsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()
  const [{ resorts, intro, hub, meta, cityName }, nearby] = await Promise.all([load(), getNearbyHubs()])
  const hubBySlug = new Map(nearby.filter((h) => h.indexable).map((h) => [h.slug, h.path]))
  let n = 0
  const num = () => String(++n).padStart(2, '0')

  return (
    <Page locale={locale} path={RESORTS_PATH}>
      {hub.indexable && locale === 'ar' && (
        <JsonLd data={collectionPageLd({ base: siteBase(), path: RESORTS_PATH, locale: 'ar', name: meta.title, description: meta.description, dateModified: latest(...resorts.map((t) => latest(t.updatedAt, t.checkedAt))) ?? null })} />
      )}
      <ArabicOnly locale={locale}>
        <section className="dark band2">
          <SyrianFill id="khatam" opacity={0.1} />
          <div className="wrap page-hero" style={{ paddingTop: 56, paddingBottom: 56 }}>
            <Crumbs items={[{ href: '/inside', label: 'جوّا سوريا' }, { label: RESORTS_TOPIC }]} />
            <span className="eyebrow rise">للي عايشين بسوريا · عربي فقط</span>
            <h1 className="big rise2">{RESORTS_TOPIC}</h1>
            {intro ? (
              <p className="lede rise3" style={{ fontSize: 19, maxWidth: 680 }}>
                {intro}
              </p>
            ) : (
              // No generated text: until an editor writes the intro the page says only what it is (and stays noindex).
              <p className="lede rise3" style={{ fontSize: 19, maxWidth: 680 }}>
                {resorts.length} مصايف، مرتّبة متل ما رتّبها المحررون.
              </p>
            )}
          </div>
          <MuqarnasEdge />
        </section>

        <section className="sec trips">
          <div className="wrap">
            <div className="sec-head" style={{ marginTop: 24, marginBottom: 8 }}>
              <h2>المصايف</h2>
              <span className="more" style={{ color: 'var(--ink2)', fontWeight: 400 }}>
                {resorts.length} مصايف
              </span>
            </div>
            {resorts.length ? (
              <div className="cards">
                {resorts.map((t) => {
                  const from = cityName(t)
                  return (
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
                        <span className="meta">{[from && `من ${from}`, t.distanceNote].filter(Boolean).join(' · ')}</span>
                        <h3 className="title">{t.title}</h3>
                        {t.description && <p style={{ fontSize: 15 }}>{t.description}</p>}
                        <span className="trip-has">فنادق · مطاعم · طبيعة · خريطة</span>
                        <span className="go">افتح صفحة المصيف ←</span>
                      </span>
                    </Link>
                  )
                })}
              </div>
            ) : (
              <p className="empty">ما في مصايف منشورة بعد.</p>
            )}
          </div>
        </section>

        <section className="sec">
          <div className="wrap" style={{ paddingBlock: 24 }}>
            <p className="copy">
              بدك مشوار غير المصايف؟ آثار وينابيع وبحيرات على <Link href="/inside">صفحة جوّا سوريا</Link>
              {[...new Set(resorts.flatMap((t) => asDoc(t.fromCity)?.slug ?? []))].filter((s) => hubBySlug.has(s)).length > 0 && '، أو حسب مدينتك: '}
              {[...new Set(resorts.flatMap((t) => asDoc(t.fromCity)?.slug ?? []))]
                .filter((s) => hubBySlug.has(s))
                .map((s, i, all) => {
                  const t = resorts.find((r) => asDoc(r.fromCity)?.slug === s)!
                  return (
                    <span key={s}>
                      {i > 0 && (i === all.length - 1 ? ' و' : '، ')}
                      <Link href={hubBySlug.get(s)!}>مشاوير قريبة من {cityName(t)}</Link>
                    </span>
                  )
                })}
              . وكل مدينة إلها صفحتها على <Link href={localePath('ar', '/cities')}>صفحة المدن</Link>.
            </p>
          </div>
        </section>
      </ArabicOnly>
    </Page>
  )
}

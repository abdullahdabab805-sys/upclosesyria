import { describe, expect, it } from 'vitest'
import { DayTrips } from '@/collections/DayTrips'
import { RESORT_TAG, RESORTS_PATH, RESORTS_TOPIC, resortsHub, resortTrips } from '@/lib/resorts'
import { RESERVED_TRIP_SLUGS } from '@/lib/rural'
import { indexablePaths, pageMetadata } from '@/lib/seo'
import { DESC_MAX, len, resortsMeta, TITLE_MAX, TITLE_SUFFIX } from '@/lib/seoText'
import { FORBIDDEN_META } from '@/lib/seoAudit'
import { sectionPages, type SitemapSnapshot } from '@/lib/sitemap'

// SEO day 19: one page for "أجمل مصايف سوريا", built from the trips tagged "مصيف" and indexed only with
// enough of them AND a human-written intro. Test data below is invented and labelled as such.

const INTRO = 'نص تجريبي للاختبار فقط: مصايف الجبل والساحل للعيلة بالصيف، هوا بارد وينابيع وغابات، ولكل مصيف صفحته.'
const trips = [{ tag: 'مصيف' }, { tag: ' مصيف ' }, { tag: 'آثار' }, { tag: null }, {}, { tag: 'مصيف' }, { tag: 'مصايف' }]

describe('which trips are resorts', () => {
  it('exactly the editors’ "مصيف" tag (trimmed), in their order', () => {
    expect(RESORT_TAG).toBe('مصيف')
    expect(resortTrips(trips)).toEqual([trips[0], trips[1], trips[5]])
  })
})

describe('the indexability gate', () => {
  it('needs 3 resorts and an intro of a real sentence', () => {
    expect(resortsHub(trips, INTRO)).toEqual({ path: RESORTS_PATH, resorts: 3, indexable: true, reasons: [] })
    expect(resortsHub(trips.slice(0, 2), INTRO)).toMatchObject({ resorts: 2, indexable: false, reasons: ['few-trips'] })
    expect(resortsHub(trips, '')).toMatchObject({ indexable: false, reasons: ['no-intro'] })
    expect(resortsHub(trips, 'قريباً')).toMatchObject({ indexable: false, reasons: ['short-intro'] })
    expect(resortsHub(trips, undefined)).toMatchObject({ indexable: false, reasons: ['no-intro'] })
  })

  it('lives under /inside, so it is Arabic only, and noindex in Arabic too until the gate opens', () => {
    expect(indexablePaths(RESORTS_PATH)).toEqual([RESORTS_PATH])
    expect(pageMetadata({ locale: 'en', path: RESORTS_PATH, title: 't', arabicOnly: true }).robots).toEqual({ index: false, follow: true })
    expect(pageMetadata({ locale: 'ar', path: RESORTS_PATH, title: 't', arabicOnly: true, noindex: true }).robots).toMatchObject({ index: false })
  })

  it('no trip can take the hub’s address', () => {
    expect(RESERVED_TRIP_SLUGS).toEqual(['near', 'resorts'])
    const slug = DayTrips.fields.find((f) => 'name' in f && f.name === 'slug') as { validate: (v: unknown) => true | string }
    expect(slug.validate('resorts')).toBe('هالمعرّف محجوز لصفحة ثانية بالموقع')
    expect(slug.validate('near')).toBe('هالمعرّف محجوز لصفحة ثانية بالموقع')
    expect(slug.validate('slunfeh')).toBe(true)
    expect(slug.validate('')).toBe(true)
    expect(slug.validate(null)).toBe(true)
    expect(slug.validate('Bad Slug')).toBe('حروف لاتينية صغيرة وأرقام وشرطات فقط')
  })
})

describe('title and description', () => {
  const facts = { intro: INTRO, names: ['بلودان', 'صلنفة', 'كسب', 'مشتى الحلو', 'بلودان'], fromCities: ['دمشق', 'اللاذقية', 'اللاذقية', 'طرطوس'] }

  it('names as many resorts as fit the title', () => {
    const { title } = resortsMeta(facts)
    expect(title.startsWith(RESORTS_TOPIC)).toBe(true)
    expect(title).toContain('بلودان')
    expect(len(title + TITLE_SUFFIX.ar)).toBeLessThanOrEqual(TITLE_MAX)
    expect(resortsMeta({ names: [], fromCities: [] }).title).toBe(RESORTS_TOPIC)
  })

  it('leads with the editor’s intro and states only what the page shows', () => {
    const { description } = resortsMeta(facts)
    expect(description.startsWith(INTRO)).toBe(true)
    expect(len(description)).toBeLessThanOrEqual(DESC_MAX)
    expect(description).not.toMatch(FORBIDDEN_META)
    const bare = resortsMeta({ names: ['أ', 'ب', 'ج'], fromCities: ['دمشق', 'دمشق'] }).description
    expect(bare).toContain('3 مصايف')
    expect(bare).toContain('دمشق')
    expect(bare).not.toContain('دمشق ودمشق')
  })
})

describe('sitemap', () => {
  const snap: SitemapSnapshot = {
    cities: [],
    children: [],
    trips: [
      { path: '/inside/bloudan', fromCity: 1, place: null, at: '2026-10-10T00:00:00.000Z', images: [] },
      { path: '/inside/apamea', fromCity: 6, place: null, at: '2026-11-01T00:00:00.000Z', images: [] },
    ],
    reports: [],
    firstVisit: [],
    stories: [],
    guides: [],
    videos: [],
    nearby: [],
  }

  it('an indexable hub joins the countryside section, dated by its intro and its own trips only', () => {
    const pages = sectionPages('countryside', { ...snap, resorts: { path: RESORTS_PATH, trips: ['/inside/bloudan'], at: '2026-10-05T00:00:00.000Z' } })
    expect(pages.at(-1)).toEqual({ path: RESORTS_PATH, lastmod: '2026-10-10T00:00:00.000Z' })
  })

  it('not indexable (null or missing): not in the sitemap', () => {
    expect(sectionPages('countryside', { ...snap, resorts: null }).map((p) => p.path)).not.toContain(RESORTS_PATH)
    expect(sectionPages('countryside', snap).map((p) => p.path)).not.toContain(RESORTS_PATH)
  })
})

import { describe, expect, it } from 'vitest'
import { cleanIntro, indexableNearbyPaths, NEARBY_MIN_INTRO, NEARBY_MIN_TRIPS, nearbyGate, nearbyHubs, nearbyPath, nearbyTopic, parseNearbySlug } from '@/lib/nearby'
import { collectionPageLd } from '@/lib/jsonld'
import { indexablePaths, pageMetadata } from '@/lib/seo'
import { DESC_MAX, len, nearbyMeta, TITLE_MAX, TITLE_SUFFIX } from '@/lib/seoText'
import { FORBIDDEN_META } from '@/lib/seoAudit'

// SEO day 8: one page per intent ("مشاوير قريبة من <city>"), indexed only with enough trips AND a
// human-written intro. Test data below is invented and labelled as such; it is not site content.

const INTRO = 'نص تجريبي للاختبار فقط: مشاوير يوم قريبة من المدينة للعيلة والشباب، ينابيع ومصايف وآثار، أغلبها بتنعمل بنهار واحد.'

describe('the indexability gate', () => {
  it('needs the minimum number of trips and an intro of a real sentence', () => {
    expect(nearbyGate({ trips: NEARBY_MIN_TRIPS, intro: INTRO })).toEqual({ indexable: true, reasons: [] })
    expect(nearbyGate({ trips: NEARBY_MIN_TRIPS - 1, intro: INTRO })).toEqual({ indexable: false, reasons: ['few-trips'] })
    expect(nearbyGate({ trips: 10, intro: '' })).toEqual({ indexable: false, reasons: ['no-intro'] })
    expect(nearbyGate({ trips: 10, intro: null })).toEqual({ indexable: false, reasons: ['no-intro'] })
    expect(nearbyGate({ trips: 10, intro: 'قريباً' })).toEqual({ indexable: false, reasons: ['short-intro'] })
    expect(nearbyGate({ trips: 0, intro: '   ' })).toEqual({ indexable: false, reasons: ['few-trips', 'no-intro'] })
  })

  it('counts characters, not UTF-16 units, and ignores padding', () => {
    const exact = 'س'.repeat(NEARBY_MIN_INTRO)
    expect(nearbyGate({ trips: 5, intro: `  ${exact}  ` }).indexable).toBe(true)
    expect(nearbyGate({ trips: 5, intro: exact.slice(1) }).indexable).toBe(false)
    expect(cleanIntro(' سطر\n\nثاني ')).toBe('سطر ثاني')
    expect(cleanIntro(42)).toBe('')
  })
})

describe('hubs', () => {
  const cities = [
    { id: 1, slug: 'damascus', parentCity: null, nearbyIntro: INTRO },
    { id: 2, slug: 'bloudan', parentCity: 1, nearbyIntro: INTRO },
    { id: 3, slug: 'aleppo', parentCity: null },
    { id: 4, slug: 'raqqa', parentCity: null, nearbyIntro: INTRO },
  ]
  const trips = [{ fromCity: 1 }, { fromCity: { id: 1 } }, { fromCity: 1 }, { fromCity: 3 }, { fromCity: 3 }, { fromCity: 3 }, { fromCity: 2 }, { fromCity: null }, { fromCity: 4 }]

  it('one per main city with trips; resorts never get one', () => {
    const hubs = nearbyHubs(cities, trips)
    expect(hubs.map((h) => [h.slug, h.trips, h.indexable, h.reasons])).toEqual([
      ['damascus', 3, true, []],
      ['aleppo', 3, false, ['no-intro']],
      ['raqqa', 1, false, ['few-trips']],
    ])
    expect(indexableNearbyPaths(cities, trips)).toEqual(['/inside/near/damascus'])
  })

  it('lives under /inside, so it is Arabic only (no English URL is ever indexable)', () => {
    expect(nearbyPath('damascus')).toBe('/inside/near/damascus')
    expect(indexablePaths(nearbyPath('damascus'))).toEqual(['/inside/near/damascus'])
    const en = pageMetadata({ locale: 'en', path: nearbyPath('damascus'), title: 't', arabicOnly: true })
    expect(en.robots).toEqual({ index: false, follow: true })
    expect(en.alternates?.languages).toEqual({ ar: '/inside/near/damascus', 'x-default': '/inside/near/damascus' })
  })

  it('a non-indexable hub is noindex in Arabic too', () => {
    const ar = pageMetadata({ locale: 'ar', path: nearbyPath('aleppo'), title: 't', arabicOnly: true, noindex: true })
    expect(ar.robots).toEqual({ index: false, follow: false })
  })

  it('accepts only slug-shaped keys', () => {
    expect(parseNearbySlug('deir-ez-zor')).toBe('deir-ez-zor')
    expect(parseNearbySlug('../admin')).toBeNull()
    expect(parseNearbySlug('Damascus')).toBeNull()
  })
})

describe('title and description', () => {
  const base = { cityName: 'دمشق', intro: INTRO, trips: 12, kinds: ['مصيف', 'آثار', 'مصيف', ' نبع ', ''], withDistance: 12, reports: 2 }

  it('topic first, within the title length, from the trips’ own kinds', () => {
    const { title } = nearbyMeta(base)
    expect(title.startsWith(nearbyTopic('دمشق'))).toBe(true)
    expect(len(title + TITLE_SUFFIX.ar)).toBeLessThanOrEqual(TITLE_MAX)
    expect(title).toContain('مصيف')
  })

  it('the description leads with the editor’s intro and states only what the page shows', () => {
    const { description } = nearbyMeta(base)
    expect(len(description)).toBeLessThanOrEqual(DESC_MAX)
    expect(description.startsWith('نص تجريبي')).toBe(true)
    const bare = nearbyMeta({ ...base, intro: null, withDistance: 3, reports: 0 }).description
    expect(bare).toContain('12 مشوار من دمشق')
    // Distance only when every trip has one; reports only when there are some.
    expect(bare).not.toContain('المسافة')
    expect(bare).not.toContain('تقارير')
    expect(nearbyMeta({ ...base, intro: null }).description).toContain('المسافة من المدينة')
  })

  it('never mentions prices or safety', () => {
    const { title, description } = nearbyMeta(base)
    expect(`${title} ${description}`).not.toMatch(FORBIDDEN_META)
    const bare = nearbyMeta({ ...base, intro: null })
    expect(`${bare.title} ${bare.description}`).not.toMatch(FORBIDDEN_META)
  })
})

describe('CollectionPage schema', () => {
  it('a plain WebPage type published by the guide, with no list markup', () => {
    const ld = collectionPageLd({ base: 'https://x.org', path: '/inside/near/damascus', locale: 'ar', name: 'n', description: 'd', dateModified: '2026-11-01T00:00:00.000Z' })
    expect(ld).toEqual({
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      '@id': 'https://x.org/inside/near/damascus',
      url: 'https://x.org/inside/near/damascus',
      name: 'n',
      description: 'd',
      inLanguage: 'ar',
      dateModified: '2026-11-01T00:00:00.000Z',
      publisher: { '@id': 'https://x.org/#org' },
    })
    expect(collectionPageLd({ base: 'https://x.org', path: '/p', locale: 'ar', name: 'n' })).not.toHaveProperty('dateModified')
  })
})

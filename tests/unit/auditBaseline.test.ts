import { describe, expect, it } from 'vitest'
import {
  compare,
  geoMetrics,
  lighthouseMetrics,
  mediaMetrics,
  seoMetrics,
  weeklyMarkdown,
  worse,
  type MediaRow,
  type SeoJson,
  type SeoPage,
  type Snapshot,
} from '@/lib/auditBaseline'

const page = (path: string, over: Partial<SeoPage> = {}): SeoPage => ({
  path,
  url: `https://www.upclosesyria.com${path}`,
  status: 200,
  robots: 'index, follow',
  title: `t ${path}`,
  description: `d ${path}`,
  canonical: `https://www.upclosesyria.com${path}`,
  h1: ['h'],
  imgsNoAlt: 0,
  links: ['/', '/cities/damascus', '/cities/aleppo'].filter((l) => l !== path),
  ...over,
})
const seo = (pages: SeoPage[], over: Partial<SeoJson> = {}): SeoJson => ({ pages, broken: [], redirects: [], ...over })
const snap = (s: ReturnType<typeof seoMetrics>, extra: Snapshot['metrics'] = {}): Snapshot => ({ base: 'https://x', date: '2026-11-04T00:00:00Z', ...s, metrics: { ...s.metrics, ...extra } })

const clean = [page('/'), page('/cities/damascus'), page('/cities/aleppo')]

const mediaRow = (over: Partial<MediaRow> = {}): MediaRow => ({
  path: '/cities/damascus',
  imgs: [{ alt: 'سوق', src: '/a.jpg', file: { kb: 80 } }],
  loading: [],
  iframes: 0,
  lcp: { tag: 'img', src: '/a.jpg', ms: 900 },
  share: { file: { status: 200 } },
  ld: [{ file: { status: 200 } }],
  sitemap: [{ file: { status: 0 } }],
  videoIssues: [],
  ...over,
})

describe('seoMetrics', () => {
  it('counts nothing on a clean site', () => {
    const { metrics, noindexInSitemap, statuses } = seoMetrics(seo(clean))
    expect(metrics['seo.sitemapPages']!.value).toBe(3)
    for (const [k, m] of Object.entries(metrics)) if (k !== 'seo.sitemapPages') expect(m.value, k).toBe(0)
    expect(noindexInSitemap).toEqual([])
    expect(statuses['/cities/damascus']).toBe(200)
  })

  it('finds orphans, duplicates, H1, canonical, alt and non-200 pages', () => {
    const pages = [
      ...clean,
      page('/lonely', { title: 't /', h1: [] }),
      page('/gone', { status: 404 }),
      page('/moved', { canonical: 'https://www.upclosesyria.com/other', imgsNoAlt: 2, description: 'd /' }),
      page('/bad-canonical', { canonical: 'http://[bad' }),
    ]
    pages[0]!.links.push('/moved', '/bad-canonical')
    const { metrics } = seoMetrics(seo(pages, { broken: [['/x', {}]], redirects: [['/a', { hops: 1 }], ['/b', { hops: 2 }]] }))
    expect(metrics['seo.orphans']!.value).toBe(1)
    expect(metrics['seo.non200']!.value).toBe(1)
    expect(metrics['seo.duplicateTitlePages']!.value).toBe(2)
    expect(metrics['seo.duplicateDescriptionPages']!.value).toBe(2)
    expect(metrics['seo.h1NotOne']!.value).toBe(1)
    expect(metrics['seo.canonicalMismatch']!.value).toBe(2)
    expect(metrics['seo.imagesWithoutAlt']!.value).toBe(2)
    expect(metrics['seo.brokenLinks']!.value).toBe(1)
    expect(metrics['seo.redirectChains']!.value).toBe(1)
  })

  it('lists noindex pages that are in the sitemap', () => {
    expect(seoMetrics(seo([...clean, page('/en/inside', { robots: 'noindex, follow' })])).noindexInSitemap).toEqual(['/en/inside'])
  })
})

describe('geoMetrics', () => {
  it('counts blocked requests, content problems and invalid JSON-LD', () => {
    const m = geoMetrics({
      rows: [{ status: 200, block: null }, { status: 403, block: null }, { status: 200, block: 'challenge' }],
      pages: [{ path: '/', facts: { ldTypes: ['WebSite'] } }, { path: '/x', facts: { ldTypes: ['INVALID'] } }, { path: '/y', facts: null }],
      problems: [{ path: '/x', problem: 'no H1' }],
    })
    expect(m['geo.blockedOrNon200']!.value).toBe(2)
    expect(m['geo.contentProblems']!.value).toBe(1)
    expect(m['geo.invalidJsonLdPages']!.value).toBe(1)
  })
  it('reads older output without a problems list as zero', () => {
    expect(geoMetrics({ rows: [], pages: [] })['geo.contentProblems']!.value).toBe(0)
  })
})

describe('mediaMetrics', () => {
  it('is all zero on a clean page and records the LCP image weight', () => {
    const m = mediaMetrics([mediaRow()])
    expect(m['media.lcpImageKb:/cities/damascus']!.value).toBe(80)
    for (const [k, v] of Object.entries(m)) if (!k.startsWith('media.lcpImageKb')) expect(v.value, k).toBe(0)
  })
  it('counts every kind of media problem', () => {
    const m = mediaMetrics([
      mediaRow({
        imgs: [{ alt: null, src: '/b.jpg', file: null }],
        loading: ['no width/height: /b.jpg', 'LCP image lazy: /b.jpg'],
        iframes: 1,
        lcp: { tag: 'h1', src: null, ms: 500 },
        share: { file: { status: 404 } },
        ld: [{ file: { status: 500 } }],
        sitemap: [{ file: { status: 403 } }],
        videoIssues: [{}],
      }),
    ])
    expect(m['media.imagesWithoutAlt']!.value).toBe(1)
    expect(m['media.imagesWithoutSize']!.value).toBe(1)
    expect(m['media.lazyLcp']!.value).toBe(1)
    expect(m['media.iframesBeforePlay']!.value).toBe(1)
    expect(m['media.brokenImageFiles']!.value).toBe(3)
    expect(m['media.videoObjectIssues']!.value).toBe(1)
    expect(Object.keys(m).some((k) => k.startsWith('media.lcpImageKb'))).toBe(false)
  })
  it('skips the LCP weight when the file was not measured', () => {
    expect(mediaMetrics([mediaRow({ share: { file: null }, imgs: [{ alt: '', src: '/a.jpg', file: { kb: null } }] })])['media.lcpImageKb:/cities/damascus']).toBeUndefined()
  })
})

describe('worse', () => {
  it('needs more than the noise margin', () => {
    expect(worse({ value: 0.95, better: 'higher', abs: 0.05 }, 0.91)).toBe(false)
    expect(worse({ value: 0.95, better: 'higher', abs: 0.05 }, 0.89)).toBe(true)
    expect(worse({ value: 2000, better: 'lower', rel: 0.2, abs: 150 }, 2390)).toBe(false)
    expect(worse({ value: 2000, better: 'lower', rel: 0.2, abs: 150 }, 2401)).toBe(true)
    expect(worse({ value: 0, better: 'lower' }, 1)).toBe(true)
    expect(worse({ value: 1, better: 'lower' }, 0)).toBe(false)
  })
})

describe('compare', () => {
  const before = snap(seoMetrics(seo(clean)), lighthouseMetrics([{ path: '/', performance: 0.95, accessibility: 1, seo: 1, bestPractices: 1, lcpMs: 2000, cls: 0, tbtMs: 50, scriptKb: 160 }]))

  it('is empty when nothing got worse', () => {
    expect(compare(before, before)).toEqual([])
  })

  it('catches the planted regressions: a noindex page in the sitemap and an image without alt', () => {
    const pages = [...clean, page('/en/inside', { robots: 'noindex', imgsNoAlt: 1 })]
    const after = snap(seoMetrics(seo(pages)), before.metrics)
    after.metrics['seo.imagesWithoutAlt'] = { ...before.metrics['seo.imagesWithoutAlt']!, value: 1 }
    const keys = compare(before, after).map((r) => r.key)
    expect(keys).toContain('noindex:/en/inside')
    expect(keys).toContain('seo.imagesWithoutAlt')
  })

  it('flags a page that was 200 and is not any more, or left the sitemap', () => {
    const after = snap(seoMetrics(seo([page('/'), page('/cities/damascus', { status: 500 })])), before.metrics)
    const r = compare(before, after)
    expect(r.find((x) => x.key === 'status:/cities/damascus')?.after).toBe(500)
    expect(r.find((x) => x.key === 'status:/cities/aleppo')?.note).toMatch(/sitemap/)
  })

  it('treats a metric missing from the run as a regression, except Lighthouse in a run without it', () => {
    const noLh = snap(seoMetrics(seo(clean)))
    expect(compare(before, noLh)).toEqual([])
    const partial = snap(seoMetrics(seo(clean)), { 'lh.performance:/': before.metrics['lh.performance:/']! })
    expect(compare(before, partial).map((r) => r.key)).toContain('lh.lcpMs:/')
    const { ['seo.orphans']: _gone, ...rest } = before.metrics
    expect(_gone).toBeDefined()
    expect(compare(before, { ...before, metrics: rest }).map((r) => r.key)).toEqual(['seo.orphans'])
  })
})

describe('weeklyMarkdown', () => {
  const s = snap(seoMetrics(seo(clean)), { 'lh.cls:/': { value: 0.012, better: 'lower', abs: 0.05 } })
  it('marks regressions, new metrics and notes, and holds only public data', () => {
    const md = weeklyMarkdown(s, { ...s, metrics: { 'seo.orphans': s.metrics['seo.orphans']! } }, [{ key: 'seo.orphans', before: 0, after: 2, note: 'أسوأ' }], ['ملاحظة'])
    expect(md).toContain('## التراجعات: 1')
    expect(md).toContain('`seo.orphans`: 0 → 2')
    expect(md).toContain('| `lh.cls:/` | — | 0.01 | جديد |')
    expect(md).toContain('- ملاحظة')
    expect(md).not.toMatch(/impressions|clicks|ctr/i)
  })
  it('says when there is no baseline yet', () => {
    const md = weeklyMarkdown(s, null, [])
    expect(md).toContain('غير موجود بعد')
    expect(md).toContain('لا شيء.')
    expect(compare(s, { ...s, statuses: { ...s.statuses, '/x': 404 } })).toEqual([])
    expect(weeklyMarkdown(s, null, [{ key: 'k', before: null, after: null, note: 'n' }])).toContain('— → —')
  })
})

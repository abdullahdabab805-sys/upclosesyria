// FAKE DATA: every number and query below is invented for the test and is not Search Console or Bing data.
import { describe, expect, it } from 'vitest'
import { freshness } from '@/lib/freshness'
import { FORBIDDEN_META } from '@/lib/seoAudit'
import {
  bingDate,
  bingQueryStats,
  bingRows,
  byLang,
  gscQuery,
  inspect,
  opportunities,
  opportunityLine,
  pageLang,
  periods,
  reportLines,
  reportMail,
  staleItems,
  totals,
  type ReportInput,
  type Row,
} from '@/lib/searchReport'

const U = 'https://www.upclosesyria.com'
const r = (over: Partial<Row>): Row => ({ clicks: 0, impressions: 0, ctr: 0, position: 1, ...over })

describe('periods', () => {
  it('ends three days ago and compares two 28-day windows back to back', () => {
    expect(periods(new Date('2026-11-08T03:00:00Z'))).toEqual({ current: { start: '2026-10-09', end: '2026-11-05' }, previous: { start: '2026-09-11', end: '2026-10-08' } })
  })
})

describe('language split and totals', () => {
  it('sends /en pages to English and the rest to Arabic', () => {
    expect(pageLang(`${U}/en/cities/damascus`)).toBe('en')
    expect(pageLang(`${U}/en`)).toBe('en')
    expect(pageLang(`${U}/english-thing`)).toBe('ar')
    expect(pageLang('/en/x')).toBe('en')
    expect(pageLang('not a url')).toBe('ar')
  })
  it('weights position by impressions', () => {
    const t = totals([r({ clicks: 1, impressions: 10, position: 2 }), r({ clicks: 1, impressions: 30, position: 10 })])
    expect(t).toEqual({ clicks: 2, impressions: 40, ctr: 0.05, position: 8 })
    expect(totals([])).toEqual({ clicks: 0, impressions: 0, ctr: 0, position: null })
    const l = byLang([r({ page: `${U}/en/x`, impressions: 5 }), r({ page: `${U}/cities/damascus`, impressions: 7 }), r({ impressions: 1 })])
    expect(l.en.impressions).toBe(5)
    expect(l.ar.impressions).toBe(8)
  })
})

describe('opportunities', () => {
  it('says the data is too thin instead of guessing', () => {
    const o = opportunities([r({ query: 'بلودان', page: `${U}/inside/bloudan`, impressions: 40, position: 12 })], [r({ page: `${U}/inside/bloudan`, impressions: 40 })])
    expect(o).toEqual({ insufficient: true, totalImpressions: 40, items: [] })
  })

  it('finds striking-distance queries, low-CTR pages and gaps, sorted by impressions', () => {
    const pages = [
      r({ page: `${U}/cities/damascus`, impressions: 400, clicks: 40, ctr: 0.1, position: 4 }),
      r({ page: `${U}/cities/aleppo`, impressions: 300, clicks: 24, ctr: 0.08, position: 6 }),
      r({ page: `${U}/cities/homs`, impressions: 200, clicks: 2, ctr: 0.01, position: 7 }),
      r({ page: `${U}/videos`, impressions: 5, ctr: 0, position: 3 }),
    ]
    const qp = [
      r({ query: 'شو في بلودان', page: `${U}/inside/bloudan`, impressions: 50, position: 11 }),
      r({ query: 'damascus hotel price', page: `${U}/cities/damascus`, impressions: 20, position: 15 }),
      r({ query: 'rare query', page: `${U}/x`, impressions: 3, position: 9 }),
      r({ query: 'aleppo souq', page: `${U}/cities/aleppo`, impressions: 30, position: 4 }),
      r({ query: 'syria visa on arrival', page: `${U}/outside`, impressions: 25, position: 35 }),
      r({ query: 'حلويات حمص', page: `${U}/cities/homs`, impressions: 12, position: 40 }),
      r({ query: 'nowhere', impressions: 12, position: 50 }),
      r({ page: `${U}/x`, impressions: 99, position: 30 }),
    ]
    const o = opportunities(qp, pages)
    expect(o.insufficient).toBe(false)
    const kinds = o.items.map((i) => `${i.kind}:${'query' in i ? i.query : i.page}`)
    expect(kinds).toEqual([
      `lowCtr:${U}/cities/homs`,
      'striking:شو في بلودان',
      'gap:syria visa on arrival',
      'striking:damascus hotel price',
      'gap:حلويات حمص',
      'gap:nowhere',
    ])
    const priced = o.items.find((i) => 'query' in i && i.query === 'damascus hotel price')!
    expect('forbidden' in priced && priced.forbidden).toBe(true)
    const gapAr = o.items.find((i) => i.kind === 'gap' && i.query === 'حلويات حمص')
    expect(gapAr && gapAr.kind === 'gap' && gapAr.lang).toBe('ar')
  })

  it('the advice it writes never contains a price or safety word (ق4), and marks queries that do', () => {
    const lines = [
      opportunityLine({ kind: 'striking', query: 'Q', page: `${U}/cities/damascus`, position: 9, impressions: 20, forbidden: true }),
      opportunityLine({ kind: 'lowCtr', page: `${U}/cities/homs`, impressions: 200, ctr: 0.01, siteMedianCtr: 0.08, position: 7 }),
      opportunityLine({ kind: 'gap', query: 'Q', bestPosition: 30, impressions: 12, lang: 'en', audience: 'المهجر والأجانب', forbidden: false }),
      opportunityLine({ kind: 'gap', query: 'Q', bestPosition: 30, impressions: 12, lang: 'ar', audience: 'x', forbidden: true }),
    ]
    for (const l of lines) expect(l).not.toMatch(FORBIDDEN_META)
    expect(lines[0]).toContain('ق4')
    expect(lines[1]).toContain('/cities/homs')
  })
})

describe('Bing', () => {
  it('reads WCF dates and sums one period per query', () => {
    expect(bingDate('/Date(1762300800000)/')).toBe('2025-11-05')
    expect(bingDate('/Date(1762300800000-0800)/')).toBe('2025-11-05')
    expect(bingDate('2025-11-05')).toBeNull()
    const day = (d: string) => `/Date(${Date.parse(d)})/`
    const stats = [
      { Query: 'damascus', Impressions: 10, Clicks: 1, AvgImpressionPosition: 4, Date: day('2026-10-20') },
      { Query: 'damascus', Impressions: 30, Clicks: 1, AvgImpressionPosition: 8, Date: day('2026-10-21') },
      { Query: 'damascus', Impressions: 99, Clicks: 9, AvgImpressionPosition: 1, Date: day('2026-01-01') },
      { Query: 'zero', Impressions: 0, Clicks: 0, AvgImpressionPosition: 0, Date: day('2026-10-20') },
      { Query: 'bad', Impressions: 1, Clicks: 0, AvgImpressionPosition: 1, Date: 'x' },
    ]
    const rows = bingRows(stats, { start: '2026-10-09', end: '2026-11-05' })
    expect(rows).toEqual([
      { query: 'damascus', clicks: 2, impressions: 40, ctr: 0.05, position: 7 },
      { query: 'zero', clicks: 0, impressions: 0, ctr: 0, position: 0 },
    ])
  })
})

describe('fetchers', () => {
  it('maps Search Console rows onto the requested dimensions', async () => {
    let sent: { url: string; body: unknown } | null = null
    const fake = (async (url: string, init?: RequestInit) => {
      sent = { url, body: JSON.parse(String(init?.body)) }
      return Response.json({ rows: [{ keys: ['بلودان', `${U}/inside/bloudan`], clicks: 1, impressions: 9, ctr: 0.11, position: 12 }] })
    }) as typeof fetch
    const rows = await gscQuery('tok', 'sc-domain:upclosesyria.com', { start: '2026-10-09', end: '2026-11-05' }, ['query', 'page'], fake)
    expect(rows).toEqual([{ query: 'بلودان', page: `${U}/inside/bloudan`, clicks: 1, impressions: 9, ctr: 0.11, position: 12 }])
    expect(sent!.url).toContain('sites/sc-domain%3Aupclosesyria.com/searchAnalytics/query')
    expect(sent!.body).toMatchObject({ startDate: '2026-10-09', endDate: '2026-11-05', dimensions: ['query', 'page'], type: 'web' })
    expect(await gscQuery('t', 's', { start: 'a', end: 'b' }, ['page'], (async () => Response.json({})) as typeof fetch)).toEqual([])
    await expect(gscQuery('t', 's', { start: 'a', end: 'b' }, ['page'], (async () => new Response('', { status: 403 })) as typeof fetch)).rejects.toThrow('403')
  })

  it('reads the index verdict, and reports an error status instead of throwing', async () => {
    const ok = (async () => Response.json({ inspectionResult: { indexStatusResult: { verdict: 'PASS', coverageState: 'Submitted and indexed', lastCrawlTime: '2026-11-01T10:00:00Z' } } })) as typeof fetch
    expect(await inspect('t', 's', `${U}/`, ok)).toEqual({ url: `${U}/`, verdict: 'PASS', coverage: 'Submitted and indexed', lastCrawl: '2026-11-01T10:00:00Z' })
    expect((await inspect('t', 's', `${U}/`, (async () => Response.json({})) as typeof fetch)).verdict).toBe('UNKNOWN')
    expect((await inspect('t', 's', `${U}/`, (async () => new Response('', { status: 429 })) as typeof fetch)).verdict).toBe('ERROR 429')
  })

  it('calls Bing GetQueryStats with the site and key', async () => {
    let url = ''
    const fake = (async (u: string) => {
      url = u
      return Response.json({ d: [{ Query: 'q', Impressions: 1, Clicks: 0, AvgImpressionPosition: 3, Date: '/Date(0)/' }] })
    }) as typeof fetch
    expect(await bingQueryStats('KEY', `${U}/`, fake)).toHaveLength(1)
    expect(url).toContain('GetQueryStats?siteUrl=https%3A%2F%2Fwww.upclosesyria.com%2F&apikey=KEY')
    expect(await bingQueryStats('K', 'S', (async () => Response.json({})) as typeof fetch)).toEqual([])
    await expect(bingQueryStats('K', 'S', (async () => new Response('', { status: 401 })) as typeof fetch)).rejects.toThrow('401')
  })
})

describe('staleItems', () => {
  const now = new Date('2026-11-08T03:00:00Z')
  it('uses the site limits and splits stale from never checked, oldest first', () => {
    const { stale, pending } = staleItems(
      [
        { citySlug: 'damascus', type: 'electricity', verifiedAt: '2026-10-01T00:00:00Z', verifiedByName: 'مراسل دمشق' },
        { citySlug: 'aleppo', type: 'roads', verifiedAt: '2026-09-01T00:00:00Z', verifiedByName: null },
        { citySlug: 'homs', type: 'internet', verifiedAt: '2026-11-06T00:00:00Z' },
        { citySlug: null, type: 'custom', verifiedAt: null },
      ],
      [
        { topic: 'visa', title: 'التأشيرة', lastVerifiedAt: '2026-09-01T00:00:00Z', lastVerifiedByName: 'فريق التحرير' },
        { topic: 'money', title: 'المال', lastVerifiedAt: '2026-11-01T00:00:00Z' },
      ],
      { statusDays: 7, firstVisitDays: 30 },
      now,
      freshness,
    )
    expect(stale.map((s) => `${s.page}|${s.label}`)).toEqual(['/cities/aleppo|حال البلد: الطرق', '/outside/first-visit/visa|أول زيارة: التأشيرة', '/cities/damascus|حال البلد: الكهرباء'])
    expect(stale[2]).toMatchObject({ by: 'مراسل دمشق', maxAgeDays: 7 })
    expect(pending).toEqual([{ kind: 'status', page: '—', label: 'حال البلد: custom', verifiedAt: null, by: null, maxAgeDays: 7 }])
  })
})

describe('report', () => {
  const p = periods(new Date('2026-11-08T03:00:00Z'))
  const empty = { clicks: 0, impressions: 0, ctr: 0, position: null }
  const base: ReportInput = {
    fetchedAt: '2026-11-08T03:05:00.000Z',
    periods: p,
    gsc: { ok: false, reason: 'GSC_SERVICE_ACCOUNT_JSON غير مضبوط في Vercel' },
    bing: { ok: false, reason: 'BING_WEBMASTER_API_KEY غير مضبوط في Vercel' },
    stale: [],
    pending: [],
  }

  it('says which key is missing and still lists stale facts', () => {
    const lines = reportLines({ ...base, stale: [{ kind: 'status', page: '/cities/damascus', label: 'حال البلد: الكهرباء', verifiedAt: '2026-10-01T00:00:00Z', by: 'مراسل', maxAgeDays: 7 }], pending: [{ kind: 'status', page: '—', label: 'x', verifiedAt: null, by: null, maxAgeDays: 7 }] })
    expect(lines).toContain('غير مفعّل: GSC_SERVICE_ACCOUNT_JSON غير مضبوط في Vercel')
    expect(lines).toContain('- /cities/damascus · حال البلد: الكهرباء · آخر تحقق 2026-10-01 · مراسل (الحد 7 يوماً)')
    expect(lines.join('\n')).toContain('لم يُتحقق منه بعد')
    expect(lines.join('\n')).toContain('جُلب في 2026-11-08 03:05 UTC')
  })

  it('shows dated totals per language, inspections and opportunities when data exists', () => {
    const lines = reportLines({
      ...base,
      gsc: {
        ok: true,
        data: {
          current: { ar: { clicks: 10, impressions: 200, ctr: 0.05, position: 9.2 }, en: empty },
          previous: { ar: { clicks: 5, impressions: 100, ctr: 0.05, position: 11 }, en: { clicks: 1, impressions: 0, ctr: 0, position: null } },
          opportunities: { insufficient: false, totalImpressions: 200, items: [{ kind: 'striking', query: 'شو في بلودان', page: `${U}/inside/%D8%A8`, position: 11, impressions: 50, forbidden: false }] },
          inspections: [{ url: `${U}/cities/damascus`, verdict: 'PASS', coverage: 'Submitted and indexed', lastCrawl: '2026-11-01T10:00:00Z' }, { url: 'x', verdict: 'UNKNOWN', coverage: '', lastCrawl: null }],
        },
      },
      bing: { ok: true, data: { current: { clicks: 0, impressions: 3, ctr: 0, position: 5 }, previous: empty, top: [r({ query: 'damascus', impressions: 3, position: 5 })] } },
    })
    const t = lines.join('\n')
    expect(t).toContain('العربية: الظهور 200 (+100%) · النقرات 10 (+100%) · نسبة النقر 5.0% · متوسط الترتيب 9.2')
    expect(t).toContain('الإنجليزية: الظهور 0 (بلا تغيير) · النقرات 0 (-100%)')
    expect(t).toContain('كل اللغات: الظهور 3 (جديد)')
    expect(t).toContain('/cities/damascus · PASS · Submitted and indexed · آخر زحف 2026-11-01')
    expect(t).toContain('x · UNKNOWN')
    expect(t).toContain('"شو في بلودان" → /inside/ب')
    expect(t).toContain('- "damascus" · الظهور 3')
  })

  it('says when there is too little data or nothing to suggest', () => {
    const g = (insufficient: boolean) => reportLines({ ...base, gsc: { ok: true, data: { current: { ar: empty, en: empty }, previous: { ar: empty, en: empty }, opportunities: { insufficient, totalImpressions: 12, items: [] }, inspections: [] } } }).join('\n')
    expect(g(true)).toContain('البيانات قليلة جداً ليُستنتج منها شيء (12 ظهوراً')
    expect(g(false)).toContain('لا فرص تتجاوز الحدود')
  })

  it('builds an escaped right-to-left e-mail', () => {
    const m = reportMail({ ...base, stale: [{ kind: 'firstVisit', page: '/outside/first-visit/visa', label: 'أول زيارة: <b>x</b>', verifiedAt: null, by: null, maxAgeDays: 30 }] })
    expect(m.subject).toBe('تقرير SEO الأسبوعي · 2026-11-05')
    expect(m.html).toContain('dir="rtl"')
    expect(m.html).toContain('&lt;b&gt;x&lt;/b&gt;')
    expect(m.html).toContain('<h2>Google Search Console</h2>')
    expect(m.text).toContain('هذا التقرير خاص')
  })
})

// Private weekly report (SEO day 7): Search Console and Bing numbers, content opportunities drawn from
// them, and practical facts whose last check is older than the site's own limits. It is e-mailed to the
// owner and never written to the public repository, an issue, a log or an artifact.
// Every number comes from an API response and carries the date it was fetched. No volumes, no trends,
// no forecasts are made up: with too little data the report says so and suggests nothing.
import { FORBIDDEN_META } from './seoAudit'

export type Row = { query?: string; page?: string; clicks: number; impressions: number; ctr: number; position: number }
export type Period = { start: string; end: string }
export type Totals = { clicks: number; impressions: number; ctr: number; position: number | null }
export type LangTotals = { ar: Totals; en: Totals }

const DAY = 86_400_000
const iso = (t: number) => new Date(t).toISOString().slice(0, 10)

/**
 * The last 28 days with data and the 28 before. Search Console data lags by a couple of days, so the
 * window ends three days ago (the final days would otherwise read as a drop).
 */
export function periods(now: Date): { current: Period; previous: Period } {
  const end = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) - 3 * DAY
  return {
    current: { start: iso(end - 27 * DAY), end: iso(end) },
    previous: { start: iso(end - 55 * DAY), end: iso(end - 28 * DAY) },
  }
}

/** English pages live under /en; everything else is Arabic (Arabic-only sections included). */
export const pageLang = (page: string): 'ar' | 'en' => {
  try {
    return /^\/en(\/|$)/.test(new URL(page).pathname) ? 'en' : 'ar'
  } catch {
    return /^\/en(\/|$)/.test(page) ? 'en' : 'ar'
  }
}

export function totals(rows: Row[]): Totals {
  const clicks = rows.reduce((n, r) => n + r.clicks, 0)
  const impressions = rows.reduce((n, r) => n + r.impressions, 0)
  // Average position weighted by impressions, as Search Console itself aggregates it.
  const position = impressions ? rows.reduce((n, r) => n + r.position * r.impressions, 0) / impressions : null
  return { clicks, impressions, ctr: impressions ? clicks / impressions : 0, position }
}

export const byLang = (pageRows: Row[]): LangTotals => ({
  ar: totals(pageRows.filter((r) => pageLang(r.page ?? '') === 'ar')),
  en: totals(pageRows.filter((r) => pageLang(r.page ?? '') === 'en')),
})

// Thresholds for opportunities: our own data only, no outside "benchmark CTR".
export const MIN_TOTAL_IMPRESSIONS = 100
export const MIN_ROW_IMPRESSIONS = 10
export const STRIKING = { from: 8, to: 20 }
export const LOW_CTR_MIN_IMPRESSIONS = 100

export type Opportunity =
  | { kind: 'striking'; query: string; page: string; position: number; impressions: number; forbidden: boolean }
  | { kind: 'lowCtr'; page: string; impressions: number; ctr: number; siteMedianCtr: number; position: number }
  | { kind: 'gap'; query: string; bestPosition: number; impressions: number; lang: 'ar' | 'en'; audience: string; forbidden: boolean }
export type Opportunities = { insufficient: boolean; totalImpressions: number; items: Opportunity[] }

const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b)
  if (!s.length) return 0
  const m = Math.floor(s.length / 2)
  return s.length % 2 ? s[m]! : (s[m - 1]! + s[m]!) / 2
}
const arabic = (s: string) => /[؀-ۿ]/.test(s)

/**
 * Suggestions only; nothing is changed on the site. A query with a price or safety word is still shown
 * (it is real demand) but marked: it must never be used in a title or description (content rule ق4).
 */
export function opportunities(queryPageRows: Row[], pageRows: Row[]): Opportunities {
  const totalImpressions = pageRows.reduce((n, r) => n + r.impressions, 0)
  if (totalImpressions < MIN_TOTAL_IMPRESSIONS) return { insufficient: true, totalImpressions, items: [] }
  const items: Opportunity[] = []

  for (const r of queryPageRows)
    if (r.query && r.page && r.impressions >= MIN_ROW_IMPRESSIONS && r.position >= STRIKING.from && r.position <= STRIKING.to)
      items.push({ kind: 'striking', query: r.query, page: r.page, position: r.position, impressions: r.impressions, forbidden: FORBIDDEN_META.test(r.query) })

  const top10 = pageRows.filter((r) => r.page && r.position <= 10 && r.impressions >= MIN_ROW_IMPRESSIONS)
  const siteMedianCtr = median(top10.map((r) => r.ctr))
  for (const r of top10)
    if (r.impressions >= LOW_CTR_MIN_IMPRESSIONS && r.ctr < siteMedianCtr / 2)
      items.push({ kind: 'lowCtr', page: r.page!, impressions: r.impressions, ctr: r.ctr, siteMedianCtr, position: r.position })

  const best = new Map<string, { pos: number; imp: number }>()
  for (const r of queryPageRows) {
    if (!r.query) continue
    const b = best.get(r.query)
    best.set(r.query, { pos: Math.min(b?.pos ?? Infinity, r.position), imp: (b?.imp ?? 0) + r.impressions })
  }
  for (const [query, b] of best)
    if (b.pos > STRIKING.to && b.imp >= MIN_ROW_IMPRESSIONS) {
      const lang = arabic(query) ? 'ar' : 'en'
      items.push({ kind: 'gap', query, bestPosition: b.pos, impressions: b.imp, lang, audience: lang === 'ar' ? 'الداخل أو المهجر (يقرّر المحرر)' : 'المهجر والأجانب', forbidden: FORBIDDEN_META.test(query) })
    }

  items.sort((a, b) => b.impressions - a.impressions)
  return { insufficient: false, totalImpressions, items }
}

// ---- Bing Webmaster (GetQueryStats) ----
export type BingQueryStat = { Query: string; Impressions: number; Clicks: number; AvgImpressionPosition: number; Date: string }

/** Bing's WCF dates: "/Date(1399100400000)/" or with a zone offset. */
export function bingDate(s: string): string | null {
  const m = /\/Date\((-?\d+)/.exec(s)
  return m ? iso(Number(m[1])) : null
}

/** Bing returns one row per query per day for its whole history; summed here over one period. */
export function bingRows(stats: BingQueryStat[], p: Period): Row[] {
  const m = new Map<string, { clicks: number; impressions: number; posSum: number }>()
  for (const s of stats) {
    const d = bingDate(s.Date)
    if (!d || d < p.start || d > p.end) continue
    const v = m.get(s.Query) ?? { clicks: 0, impressions: 0, posSum: 0 }
    v.clicks += s.Clicks
    v.impressions += s.Impressions
    v.posSum += s.AvgImpressionPosition * s.Impressions
    m.set(s.Query, v)
  }
  return [...m].map(([query, v]) => ({ query, clicks: v.clicks, impressions: v.impressions, ctr: v.impressions ? v.clicks / v.impressions : 0, position: v.impressions ? v.posSum / v.impressions : 0 }))
}

// ---- Facts past their check-by date (content rule ق3) ----
export type StaleItem = { kind: 'status' | 'firstVisit'; page: string; label: string; verifiedAt: string | null; by: string | null; maxAgeDays: number }
export type StatusDoc = { citySlug: string | null; type: string; verifiedAt?: string | null; verifiedByName?: string | null }
export type FirstVisitDoc = { topic: string; title: string; lastVerifiedAt?: string | null; lastVerifiedByName?: string | null }

const STATUS_LABEL: Record<string, string> = { electricity: 'الكهرباء', internet: 'الإنترنت', roads: 'الطرق', weather: 'الطقس', events: 'الفعاليات' }

/** Same rule and limits as the pages themselves (freshness.ts, siteSettings.staleness). */
export function staleItems(
  status: StatusDoc[],
  firstVisit: FirstVisitDoc[],
  limits: { statusDays: number; firstVisitDays: number },
  now: Date,
  fresh: (at: string | null | undefined, now: Date, days: number) => 'pending' | 'fresh' | 'stale',
): { stale: StaleItem[]; pending: StaleItem[] } {
  const all: (StaleItem & { state: string })[] = [
    ...status.map((s) => ({
      kind: 'status' as const,
      page: s.citySlug ? `/cities/${s.citySlug}` : '—',
      label: `حال البلد: ${STATUS_LABEL[s.type] ?? s.type}`,
      verifiedAt: s.verifiedAt ?? null,
      by: s.verifiedByName ?? null,
      maxAgeDays: limits.statusDays,
      state: fresh(s.verifiedAt, now, limits.statusDays),
    })),
    ...firstVisit.map((f) => ({
      kind: 'firstVisit' as const,
      page: `/outside/first-visit/${f.topic}`,
      label: `أول زيارة: ${f.title}`,
      verifiedAt: f.lastVerifiedAt ?? null,
      by: f.lastVerifiedByName ?? null,
      maxAgeDays: limits.firstVisitDays,
      state: fresh(f.lastVerifiedAt, now, limits.firstVisitDays),
    })),
  ]
  const strip = (x: StaleItem & { state: string }): StaleItem => ({ kind: x.kind, page: x.page, label: x.label, verifiedAt: x.verifiedAt, by: x.by, maxAgeDays: x.maxAgeDays })
  const oldest = (a: StaleItem, b: StaleItem) => (a.verifiedAt ?? '').localeCompare(b.verifiedAt ?? '')
  return { stale: all.filter((x) => x.state === 'stale').map(strip).sort(oldest), pending: all.filter((x) => x.state === 'pending').map(strip) }
}

// ---- Fetchers (fetch is injected so the logic is tested without the network) ----
type F = typeof fetch
const TIMEOUT = 20_000

export async function gscQuery(token: string, site: string, p: Period, dimensions: ('query' | 'page')[], fetchFn: F = fetch): Promise<Row[]> {
  const res = await fetchFn(`https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(site)}/searchAnalytics/query`, {
    method: 'POST',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify({ startDate: p.start, endDate: p.end, dimensions, rowLimit: 1000, type: 'web' }),
    signal: AbortSignal.timeout(TIMEOUT),
  })
  if (!res.ok) throw new Error(`Search Console searchAnalytics answered ${res.status}`)
  const body = (await res.json()) as { rows?: { keys: string[]; clicks: number; impressions: number; ctr: number; position: number }[] }
  return (body.rows ?? []).map((r) => {
    const row: Row = { clicks: r.clicks, impressions: r.impressions, ctr: r.ctr, position: r.position }
    dimensions.forEach((d, i) => (row[d] = r.keys[i]))
    return row
  })
}

export type Inspection = { url: string; verdict: string; coverage: string; lastCrawl: string | null }

/** One URL through the URL Inspection API (a few sample pages a week, far under its daily quota). */
export async function inspect(token: string, site: string, url: string, fetchFn: F = fetch): Promise<Inspection> {
  const res = await fetchFn('https://searchconsole.googleapis.com/v1/urlInspection/index:inspect', {
    method: 'POST',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify({ inspectionUrl: url, siteUrl: site }),
    signal: AbortSignal.timeout(TIMEOUT),
  })
  if (!res.ok) return { url, verdict: `ERROR ${res.status}`, coverage: '', lastCrawl: null }
  const r = ((await res.json()) as { inspectionResult?: { indexStatusResult?: { verdict?: string; coverageState?: string; lastCrawlTime?: string } } }).inspectionResult?.indexStatusResult
  return { url, verdict: r?.verdict ?? 'UNKNOWN', coverage: r?.coverageState ?? '', lastCrawl: r?.lastCrawlTime ?? null }
}

export async function bingQueryStats(apiKey: string, siteUrl: string, fetchFn: F = fetch): Promise<BingQueryStat[]> {
  const q = new URLSearchParams({ siteUrl, apikey: apiKey })
  const res = await fetchFn(`https://ssl.bing.com/webmaster/api.svc/json/GetQueryStats?${q}`, { signal: AbortSignal.timeout(TIMEOUT) })
  if (!res.ok) throw new Error(`Bing Webmaster GetQueryStats answered ${res.status}`)
  return ((await res.json()) as { d?: BingQueryStat[] }).d ?? []
}

// ---- The e-mail ----
export type Section<T> = { ok: true; data: T } | { ok: false; reason: string }
export type ReportInput = {
  fetchedAt: string
  periods: { current: Period; previous: Period }
  gsc: Section<{ current: LangTotals; previous: LangTotals; opportunities: Opportunities; inspections: Inspection[] }>
  bing: Section<{ current: Totals; previous: Totals; top: Row[] }>
  stale: StaleItem[]
  pending: StaleItem[]
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const pct = (x: number) => `${(x * 100).toFixed(1)}%`
const pos = (x: number | null) => (x === null ? '—' : x.toFixed(1))
const delta = (a: number, b: number) => (b === 0 ? (a === 0 ? 'بلا تغيير' : 'جديد') : `${a >= b ? '+' : ''}${(((a - b) / b) * 100).toFixed(0)}%`)
const path = (u: string) => {
  try {
    return decodeURI(new URL(u).pathname)
  } catch {
    return u
  }
}

function totalsLines(label: string, c: Totals, p: Totals): string[] {
  return [`${label}: الظهور ${c.impressions} (${delta(c.impressions, p.impressions)}) · النقرات ${c.clicks} (${delta(c.clicks, p.clicks)}) · نسبة النقر ${pct(c.ctr)} · متوسط الترتيب ${pos(c.position)}`]
}

export function opportunityLine(o: Opportunity): string {
  const mark = 'forbidden' in o && o.forbidden ? ' (تنبيه) فيها كلمة تمنعها القاعدة ق4: لا تُستخدم في عنوان أو وصف' : ''
  if (o.kind === 'striking') return `"${o.query}" → ${path(o.page)} · الترتيب ${pos(o.position)} · الظهور ${o.impressions}. راجع إن كانت الصفحة تجيب عن هذا السؤال في العنوان أو "باختصار" أو الأسئلة، من بيانات موجودة فعلاً.${mark}`
  if (o.kind === 'lowCtr') return `${path(o.page)} · الظهور ${o.impressions} · نسبة النقر ${pct(o.ctr)} (وسيط صفحات الموقع في أول 10 نتائج ${pct(o.siteMedianCtr)}) · الترتيب ${pos(o.position)}. راجع العنوان والوصف ضمن قواعد اليوم الرابع.`
  return `"${o.query}" · أفضل ترتيب ${pos(o.bestPosition)} · الظهور ${o.impressions} · اللغة ${o.lang === 'ar' ? 'العربية' : 'الإنجليزية'} · الجمهور: ${o.audience}. لا صفحة تجيب عنه بعد: فكرة صفحة إن كان لدينا محتوى حقيقي عنه.${mark}`
}

function staleLine(s: StaleItem): string {
  const when = s.verifiedAt ? s.verifiedAt.slice(0, 10) : 'لم يُتحقق منه بعد'
  return `${s.page} · ${s.label} · آخر تحقق ${when}${s.by ? ` · ${s.by}` : ''} (الحد ${s.maxAgeDays} يوماً)`
}

/** Plain-text lines of the report; the HTML version is the same lines, escaped, right-to-left. */
export function reportLines(r: ReportInput): string[] {
  const { current: c, previous: p } = r.periods
  const L: string[] = [`التقرير الأسبوعي الخاص · جُلب في ${r.fetchedAt.slice(0, 16).replace('T', ' ')} UTC`, `الفترة: ${c.start} → ${c.end} مقارنة بـ ${p.start} → ${p.end}`, '']
  L.push('## Google Search Console')
  if (!r.gsc.ok) L.push(`غير مفعّل: ${r.gsc.reason}`)
  else {
    const g = r.gsc.data
    L.push(...totalsLines('العربية', g.current.ar, g.previous.ar), ...totalsLines('الإنجليزية', g.current.en, g.previous.en))
    L.push('', '### حالة الفهرسة (عيّنة)')
    L.push(...(g.inspections.length ? g.inspections.map((i) => `${path(i.url)} · ${i.verdict}${i.coverage ? ` · ${i.coverage}` : ''}${i.lastCrawl ? ` · آخر زحف ${i.lastCrawl.slice(0, 10)}` : ''}`) : ['—']))
    L.push('', '### فرص المحتوى (اقتراحات فقط)')
    if (g.opportunities.insufficient) L.push(`البيانات قليلة جداً ليُستنتج منها شيء (${g.opportunities.totalImpressions} ظهوراً في 28 يوماً، والحد ${MIN_TOTAL_IMPRESSIONS}). لا اقتراحات هذا الأسبوع.`)
    else if (!g.opportunities.items.length) L.push('لا فرص تتجاوز الحدود هذا الأسبوع.')
    else L.push(...g.opportunities.items.slice(0, 25).map((o) => `- ${opportunityLine(o)}`))
  }
  L.push('', '## Bing Webmaster')
  if (!r.bing.ok) L.push(`غير مفعّل: ${r.bing.reason}`)
  else {
    L.push(...totalsLines('كل اللغات', r.bing.data.current, r.bing.data.previous))
    L.push(...r.bing.data.top.slice(0, 10).map((q) => `- "${q.query}" · الظهور ${q.impressions} · النقرات ${q.clicks} · الترتيب ${pos(q.position)}`))
  }
  L.push('', `## معلومات تجاوزت مدة التحقق (${r.stale.length})`)
  L.push(...(r.stale.length ? r.stale.map((s) => `- ${staleLine(s)}`) : ['لا شيء.']))
  L.push('', `## بنود لم يُتحقق منها بعد (${r.pending.length})`)
  L.push(...(r.pending.length ? r.pending.map((s) => `- ${staleLine(s)}`) : ['لا شيء.']))
  L.push('', 'لا يتغيّر شيء في الموقع تلقائياً. هذا التقرير خاص: لا تنشره كما هو، ففيه أسماء المراسلين وبيانات Search Console.')
  return L
}

export function reportMail(r: ReportInput): { subject: string; text: string; html: string } {
  const lines = reportLines(r)
  const html = lines
    .map((l) => (l.startsWith('### ') ? `<h3>${esc(l.slice(4))}</h3>` : l.startsWith('## ') ? `<h2>${esc(l.slice(3))}</h2>` : l ? `<p>${esc(l)}</p>` : ''))
    .join('\n')
  return {
    subject: `تقرير SEO الأسبوعي · ${r.periods.current.end}`,
    text: lines.join('\n'),
    html: `<div dir="rtl" lang="ar" style="font-family:'IBM Plex Sans Arabic',Tahoma,sans-serif;line-height:1.6">${html}</div>`,
  }
}

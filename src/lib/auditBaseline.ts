// Weekly audit (SEO day 7): turns the raw output of seo:audit, geo:audit, media:audit and the weekly
// Lighthouse run into a flat set of public metrics, and compares them with a committed baseline.
// Public data only: page paths, HTTP statuses, counts and lab scores. Nothing from Search Console.

/** Which way is better for a metric, and how much noise is tolerated before it counts as a regression. */
export type Spec = { better: 'lower' | 'higher'; abs?: number; rel?: number }
export type Metric = { value: number } & Spec
export type Snapshot = {
  base: string
  date: string
  metrics: Record<string, Metric>
  /** HTTP status of every sitemap URL. */
  statuses: Record<string, number>
  /** Sitemap URLs that carry noindex: always a regression, whatever the baseline says. */
  noindexInSitemap: string[]
}
export type Regression = { key: string; before: number | null; after: number | null; note: string }

// ---- Raw shapes (only the fields read here) ----
export type SeoPage = { path: string; status: number; robots: string; title: string; description: string; canonical: string; url: string; h1: string[]; imgsNoAlt: number; links: string[] }
export type SeoJson = { pages: SeoPage[]; broken: [string, unknown][]; redirects: [string, { hops: number }][] }
export type GeoJson = {
  rows: { status: number; block: string | null; path?: string; crawler?: string }[]
  pages: { path: string; facts: { ldTypes: string[] } | null }[]
  problems?: { path: string; problem: string }[]
}
export type MediaRow = {
  path: string
  imgs: { alt: string | null; src: string; file: { kb: number | null } | null }[]
  loading: string[]
  iframes: number
  lcp: { tag: string; src: string | null; ms: number } | null
  share: { file: { status: number } | null }
  ld: { file: { status: number } }[]
  sitemap: { file: { status: number } }[]
  videoIssues: unknown[]
}
export type LighthousePage = { path: string; performance: number; accessibility: number; seo: number; bestPractices: number; lcpMs: number; cls: number; tbtMs: number; scriptKb: number }

// Lab scores move by a few points between runs (CONSTRAINTS.md saw 7 points on an unchanged page), so the
// Lighthouse budgets carry a noise margin. Counts of broken things have none: one more is a regression.
const COUNT: Spec = { better: 'lower' }
const SCORE: Spec = { better: 'higher', abs: 0.05 }
const TIME: Spec = { better: 'lower', rel: 0.2, abs: 150 }
const BYTES: Spec = { better: 'lower', rel: 0.1, abs: 5 }

const count = (v: number): Metric => ({ value: v, ...COUNT })

export function seoMetrics(seo: SeoJson): Pick<Snapshot, 'metrics' | 'statuses' | 'noindexInSitemap'> {
  const ok = seo.pages.filter((p) => p.status === 200)
  const inbound = new Map<string, number>()
  for (const p of seo.pages) for (const l of new Set(p.links)) if (l !== p.path) inbound.set(l, (inbound.get(l) ?? 0) + 1)
  const dupPages = (key: 'title' | 'description') => {
    const m = new Map<string, number>()
    for (const p of ok) if (p[key]) m.set(p[key], (m.get(p[key]) ?? 0) + 1)
    return [...m.values()].filter((n) => n > 1).reduce((a, b) => a + b, 0)
  }
  const canonicalOff = ok.filter((p) => {
    try {
      return new URL(p.canonical || '/', p.url).pathname !== new URL(p.url).pathname
    } catch {
      return true
    }
  })
  return {
    metrics: {
      'seo.sitemapPages': { value: seo.pages.length, better: 'higher' },
      'seo.non200': count(seo.pages.length - ok.length),
      'seo.orphans': count(ok.filter((p) => !inbound.get(p.path)).length),
      'seo.brokenLinks': count(seo.broken.length),
      'seo.redirectChains': count(seo.redirects.filter(([, r]) => r.hops > 1).length),
      'seo.duplicateTitlePages': count(dupPages('title')),
      'seo.duplicateDescriptionPages': count(dupPages('description')),
      'seo.h1NotOne': count(ok.filter((p) => p.h1.length !== 1).length),
      'seo.canonicalMismatch': count(canonicalOff.length),
      'seo.imagesWithoutAlt': count(ok.reduce((n, p) => n + p.imgsNoAlt, 0)),
    },
    statuses: Object.fromEntries(seo.pages.map((p) => [p.path, p.status])),
    noindexInSitemap: seo.pages.filter((p) => /noindex/i.test(p.robots)).map((p) => p.path),
  }
}

export function geoMetrics(geo: GeoJson): Record<string, Metric> {
  return {
    'geo.blockedOrNon200': count(geo.rows.filter((r) => r.status !== 200 || r.block).length),
    'geo.contentProblems': count(geo.problems?.length ?? 0),
    'geo.invalidJsonLdPages': count(geo.pages.filter((p) => p.facts?.ldTypes.includes('INVALID')).length),
  }
}

export function mediaMetrics(rows: MediaRow[]): Record<string, Metric> {
  const bad = (s: number) => s !== 200 && s !== 0
  const out: Record<string, Metric> = {
    'media.imagesWithoutAlt': count(rows.reduce((n, r) => n + r.imgs.filter((i) => i.alt === null).length, 0)),
    'media.imagesWithoutSize': count(rows.reduce((n, r) => n + r.loading.filter((l) => l.startsWith('no width/height')).length, 0)),
    'media.lazyLcp': count(rows.reduce((n, r) => n + r.loading.filter((l) => l.startsWith('LCP image lazy')).length, 0)),
    'media.iframesBeforePlay': count(rows.reduce((n, r) => n + r.iframes, 0)),
    'media.brokenImageFiles': count(rows.reduce((n, r) => n + (r.share.file && bad(r.share.file.status) ? 1 : 0) + r.ld.filter((x) => bad(x.file.status)).length + r.sitemap.filter((x) => bad(x.file.status)).length, 0)),
    'media.videoObjectIssues': count(rows.reduce((n, r) => n + r.videoIssues.length, 0)),
  }
  for (const r of rows) {
    const src = r.lcp?.tag === 'img' ? r.lcp.src : null
    const kb = src ? r.imgs.find((i) => i.src === src)?.file?.kb : null
    if (typeof kb === 'number') out[`media.lcpImageKb:${r.path}`] = { value: kb, ...BYTES }
  }
  return out
}

export function lighthouseMetrics(pages: LighthousePage[]): Record<string, Metric> {
  const out: Record<string, Metric> = {}
  for (const p of pages) {
    out[`lh.performance:${p.path}`] = { value: p.performance, ...SCORE }
    out[`lh.accessibility:${p.path}`] = { value: p.accessibility, ...SCORE }
    out[`lh.seo:${p.path}`] = { value: p.seo, ...SCORE }
    out[`lh.bestPractices:${p.path}`] = { value: p.bestPractices, ...SCORE }
    out[`lh.lcpMs:${p.path}`] = { value: p.lcpMs, ...TIME }
    out[`lh.tbtMs:${p.path}`] = { value: p.tbtMs, better: 'lower', rel: 0.5, abs: 100 }
    out[`lh.cls:${p.path}`] = { value: p.cls, better: 'lower', abs: 0.05 }
    out[`lh.scriptKb:${p.path}`] = { value: p.scriptKb, ...BYTES }
  }
  return out
}

/** Worse than the baseline by more than the metric's noise margin (the larger of abs and rel × baseline). */
export function worse(before: Metric, after: number): boolean {
  const margin = Math.max(before.abs ?? 0, (before.rel ?? 0) * Math.abs(before.value))
  return before.better === 'lower' ? after > before.value + margin : after < before.value - margin
}

export function compare(baseline: Snapshot, current: Snapshot): Regression[] {
  const out: Regression[] = []
  for (const [key, b] of Object.entries(baseline.metrics)) {
    const c = current.metrics[key]
    // A metric the run could not take (Lighthouse skipped, page gone) is not silently a pass.
    if (!c) {
      // Only metrics the run was asked for: a run without Lighthouse does not report every lh.* key missing.
      if (key.startsWith('lh.') && !Object.keys(current.metrics).some((k) => k.startsWith('lh.'))) continue
      out.push({ key, before: b.value, after: null, note: 'غير مقيس في هذا التشغيل' })
    } else if (worse(b, c.value)) out.push({ key, before: b.value, after: c.value, note: 'أسوأ من خط الأساس' })
  }
  for (const [path, s] of Object.entries(baseline.statuses)) {
    const now = current.statuses[path]
    if (s === 200 && now !== 200) out.push({ key: `status:${path}`, before: 200, after: now ?? null, note: now === undefined ? 'خرجت من الـ sitemap' : 'لم تعد 200' })
  }
  for (const path of current.noindexInSitemap) out.push({ key: `noindex:${path}`, before: null, after: null, note: 'صفحة عليها noindex داخل الـ sitemap' })
  return out
}

const fmt = (v: number | null) => (v === null ? '—' : Number.isInteger(v) ? String(v) : v.toFixed(2))

/** Public Markdown summary: safe for an issue, a log or an artifact on a public repository. */
export function weeklyMarkdown(current: Snapshot, baseline: Snapshot | null, regressions: Regression[], notes: string[] = []): string {
  const rows = Object.entries(current.metrics)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, m]) => {
      const b = baseline?.metrics[k]
      const flag = regressions.some((r) => r.key === k) ? 'تراجع' : b ? 'سليم' : 'جديد'
      return `| \`${k}\` | ${b ? fmt(b.value) : '—'} | ${fmt(m.value)} | ${flag} |`
    })
  return [
    `# الفحص الأسبوعي — ${current.date.slice(0, 10)}`,
    '',
    `المصدر: \`${current.base}\` · خط الأساس: ${baseline ? baseline.date.slice(0, 10) : 'غير موجود بعد'}`,
    '',
    `## التراجعات: ${regressions.length}`,
    '',
    ...(regressions.length ? regressions.map((r) => `- \`${r.key}\`: ${fmt(r.before)} → ${fmt(r.after)} (${r.note})`) : ['لا شيء.']),
    ...(notes.length ? ['', '## ملاحظات', '', ...notes.map((n) => `- ${n}`)] : []),
    '',
    '## كل المقاييس',
    '',
    '| المقياس | خط الأساس | الآن | |',
    '| --- | --- | --- | --- |',
    ...rows,
    '',
  ].join('\n')
}

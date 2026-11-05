import type { Endpoint, Payload } from 'payload'
import { freshness } from '@/lib/freshness'
import { SEARCH_CONSOLE_SCOPE, accessToken, parseServiceAccount } from '@/lib/googleAuth'
import {
  bingQueryStats,
  bingRows,
  byLang,
  gscQuery,
  inspect,
  opportunities,
  periods,
  reportMail,
  staleItems,
  totals,
  type ReportInput,
} from '@/lib/searchReport'
import { secretMatches } from '@/lib/secret'
import { siteUrl } from '@/lib/site-url'
import { sendSafely } from './bookings'

// Pages inspected each week (URL Inspection API): one of each kind the weekly audit follows.
export const INSPECT_PATHS = ['/', '/cities/damascus', '/cities/aleppo', '/cities/homs', '/inside/bloudan', '/videos', '/en/cities/damascus']

const errorText = (e: unknown) => (e instanceof Error ? e.message : String(e))

async function gscSection(p: ReturnType<typeof periods>): Promise<ReportInput['gsc']> {
  const sa = parseServiceAccount(process.env.GSC_SERVICE_ACCOUNT_JSON)
  if (!sa) return { ok: false, reason: 'GSC_SERVICE_ACCOUNT_JSON غير مضبوط في Vercel' }
  const site = process.env.GSC_SITE_URL?.trim() || 'sc-domain:upclosesyria.com'
  try {
    const token = await accessToken(sa, SEARCH_CONSOLE_SCOPE)
    const [cur, prev, qp] = await Promise.all([gscQuery(token, site, p.current, ['page']), gscQuery(token, site, p.previous, ['page']), gscQuery(token, site, p.current, ['query', 'page'])])
    const inspections = await Promise.all(INSPECT_PATHS.map((path) => inspect(token, site, `${siteUrl()}${encodeURI(path)}`)))
    return { ok: true, data: { current: byLang(cur), previous: byLang(prev), opportunities: opportunities(qp, cur), inspections } }
  } catch (e) {
    return { ok: false, reason: `تعذّر الجلب: ${errorText(e)}` }
  }
}

async function bingSection(p: ReturnType<typeof periods>): Promise<ReportInput['bing']> {
  const key = process.env.BING_WEBMASTER_API_KEY?.trim()
  if (!key) return { ok: false, reason: 'BING_WEBMASTER_API_KEY غير مضبوط في Vercel' }
  try {
    const stats = await bingQueryStats(key, `${siteUrl()}/`)
    const cur = bingRows(stats, p.current)
    return { ok: true, data: { current: totals(cur), previous: totals(bingRows(stats, p.previous)), top: [...cur].sort((a, b) => b.impressions - a.impressions) } }
  } catch (e) {
    return { ok: false, reason: `تعذّر الجلب: ${errorText(e)}` }
  }
}

async function staleSection(payload: Payload, now: Date) {
  const settings = (await payload.findGlobal({ slug: 'siteSettings', overrideAccess: true, depth: 0 })) as { staleness?: { statusDays?: number | null; firstVisitDays?: number | null } | null }
  const limits = { statusDays: settings.staleness?.statusDays || 7, firstVisitDays: settings.staleness?.firstVisitDays || 30 }
  const status = await payload.find({ collection: 'statusItems', overrideAccess: true, depth: 1, limit: 1000, locale: 'ar', pagination: false })
  const fv = await payload.find({ collection: 'firstVisitPages', overrideAccess: true, depth: 0, limit: 100, locale: 'ar', pagination: false, where: { _status: { equals: 'published' } } })
  return staleItems(
    status.docs.map((s) => ({ citySlug: s.city && typeof s.city === 'object' ? s.city.slug : null, type: s.type, verifiedAt: s.verifiedAt, verifiedByName: s.verifiedByName })),
    fv.docs.map((f) => ({ topic: f.topic, title: f.title, lastVerifiedAt: f.lastVerifiedAt, lastVerifiedByName: f.lastVerifiedByName })),
    limits,
    now,
    freshness,
  )
}

/**
 * GET /api/seo-report: the owner's private weekly report (SEO day 7). Vercel Cron (vercel.json) calls it
 * with CRON_SECRET as a bearer token. It e-mails SEO_REPORT_TO and returns only counts, never the data,
 * so nothing from Search Console reaches a log. Search Console and Bing sections switch on when their
 * keys are set in Vercel; until then the report says which key is missing and still lists stale facts.
 */
export const seoReportEndpoint: Endpoint = {
  path: '/seo-report',
  method: 'get',
  handler: async (req) => {
    const auth = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ?? null
    if (!secretMatches(auth, process.env.CRON_SECRET)) return Response.json({ error: 'unauthorized' }, { status: 401 })
    const to = (process.env.SEO_REPORT_TO ?? '').split(',').map((s) => s.trim()).filter(Boolean)
    if (!to.length) return Response.json({ sent: false, error: 'SEO_REPORT_TO not set' }, { status: 422 })
    const now = new Date()
    const p = periods(now)
    const [gsc, bing, { stale, pending }] = await Promise.all([gscSection(p), bingSection(p), staleSection(req.payload, now)])
    const input: ReportInput = { fetchedAt: now.toISOString(), periods: p, gsc, bing, stale, pending }
    const sent = await sendSafely(req.payload, to, reportMail(input))
    return Response.json({ sent, gsc: gsc.ok, bing: bing.ok, stale: stale.length, pending: pending.length }, { status: sent ? 200 : 502 })
  },
}

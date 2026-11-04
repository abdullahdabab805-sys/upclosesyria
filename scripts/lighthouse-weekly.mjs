// Weekly Lighthouse (SEO day 7): mobile profile, 3 runs per page, the median run kept. No assertions here:
// audit:weekly compares the medians with the committed baseline (budgets from our own measurement, not
// generic numbers). The absolute floors of CONSTRAINTS.md stay with `npm run lhci`.
//   node scripts/lighthouse-weekly.mjs https://www.upclosesyria.com → lighthouse-weekly.json
// Also asks PageSpeed Insights whether Chrome UX Report (real-user) data exists for the site (PSI_API_KEY
// optional; without one Google's keyless quota applies). Lab numbers are never shown as field data.
import { chromium } from '@playwright/test'
import { spawnSync } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const base = (process.argv[2] ?? 'http://localhost:3000').replace(/\/+$/, '')

async function firstFromSitemap(section, re = /./) {
  const res = await fetch(`${base}/sitemaps/${section}.xml`).catch(() => null)
  const xml = res?.ok ? await res.text() : ''
  const paths = [...xml.matchAll(/<url><loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname)
  return paths.find((p) => re.test(decodeURIComponent(p))) ?? paths[0] ?? null
}

const pages = [
  '/',
  '/cities/damascus',
  '/cities/aleppo',
  await firstFromSitemap('countryside', /bloudan|بلودان/i),
  await firstFromSitemap('seasons', /^\/seasons\/./),
  '/videos',
  '/en/cities/damascus',
].filter(Boolean)

const outDir = '.lighthouseci/weekly'
rmSync(outDir, { recursive: true, force: true })
const rc = {
  ci: {
    collect: { url: pages.map((p) => base + p), numberOfRuns: 3, settings: { chromeFlags: '--no-sandbox --headless=new' } },
    upload: { target: 'filesystem', outputDir: outDir },
  },
}
const file = join(mkdtempSync(join(tmpdir(), 'lhci-weekly-')), 'lighthouserc.json')
writeFileSync(file, JSON.stringify(rc, null, 2))
const env = { ...process.env, CHROME_PATH: process.env.CHROME_PATH ?? chromium.executablePath() }
for (const cmd of ['collect', 'upload']) {
  const r = spawnSync(process.execPath, ['node_modules/@lhci/cli/src/cli.js', cmd, `--config=${file}`], { env, stdio: 'inherit' })
  if (r.status !== 0) process.exit(r.status ?? 1)
}

const manifest = JSON.parse(readFileSync(join(outDir, 'manifest.json'), 'utf8'))
const num = (lhr, id) => lhr.audits[id]?.numericValue ?? NaN
function scriptKb(lhr) {
  const summary = lhr.audits['resource-summary']?.details?.items?.find((i) => i.resourceType === 'script')
  if (summary) return Math.round(summary.transferSize / 1024)
  const reqs = lhr.audits['network-requests']?.details?.items ?? []
  return Math.round(reqs.filter((r) => r.resourceType === 'Script').reduce((n, r) => n + (r.transferSize ?? 0), 0) / 1024)
}
const out = manifest
  .filter((m) => m.isRepresentativeRun && existsSync(m.jsonPath))
  .map((m) => {
    const lhr = JSON.parse(readFileSync(m.jsonPath, 'utf8'))
    return {
      path: decodeURIComponent(new URL(m.url).pathname),
      performance: m.summary.performance,
      accessibility: m.summary.accessibility,
      seo: m.summary.seo,
      bestPractices: m.summary['best-practices'],
      lcpMs: Math.round(num(lhr, 'largest-contentful-paint')),
      cls: Number(num(lhr, 'cumulative-layout-shift').toFixed(3)),
      tbtMs: Math.round(num(lhr, 'total-blocking-time')),
      scriptKb: scriptKb(lhr),
    }
  })

async function crux() {
  if (!/^https:/.test(base)) return 'لا تنطبق على بناء محلي'
  const q = new URLSearchParams({ url: `${base}/`, strategy: 'mobile', category: 'performance' })
  if (process.env.PSI_API_KEY) q.set('key', process.env.PSI_API_KEY)
  try {
    const res = await fetch(`https://www.googleapis.com/pagespeedonline/v5/runPagespeed?${q}`, { signal: AbortSignal.timeout(90_000) })
    if (!res.ok) return `تعذّر السؤال (PageSpeed Insights ردّ ${res.status})`
    const body = await res.json()
    const has = (x) => x && x.metrics && Object.keys(x.metrics).length > 0
    if (has(body.originLoadingExperience)) return `متوفرة للنطاق (${Object.keys(body.originLoadingExperience.metrics).join('، ')})`
    return 'غير متوفرة بعد (زيارات Chrome الحقيقية أقل من حدّ النشر)'
  } catch (e) {
    return `تعذّر السؤال (${e instanceof Error ? e.message : String(e)})`
  }
}

writeFileSync('lighthouse-weekly.json', JSON.stringify({ base, date: new Date().toISOString(), pages: out, crux: await crux() }, null, 2))
console.log(`lighthouse-weekly: ${out.length}/${pages.length} pages → lighthouse-weekly.json`)
process.exit(out.length === pages.length ? 0 : 1)

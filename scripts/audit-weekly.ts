// Weekly audit (SEO day 7): seo:audit + geo:audit + media:audit (+ Lighthouse) in one run, compared with
// a committed baseline so a regression is caught the week it happens. Read-only: it only fetches pages.
//   npm run audit:weekly -- https://www.upclosesyria.com                 → the deployed site
//   npm run audit:weekly -- http://localhost:3100                         → the hermetic build (PR check)
//   add --lighthouse to include the weekly Lighthouse run (slow: 7 pages × 3 runs)
//   add --update-baseline to make this run the new baseline (only on purpose, never automatically)
// Baseline: audits/baseline/<host>.json. Output: audits/weekly.json and audits/WEEKLY.md (public data only).
// Exit 1 on any regression, or when an audit produced no data.
import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import {
  compare,
  geoMetrics,
  lighthouseMetrics,
  mediaMetrics,
  seoMetrics,
  weeklyMarkdown,
  type GeoJson,
  type LighthousePage,
  type MediaRow,
  type SeoJson,
  type Snapshot,
} from '../src/lib/auditBaseline'

const args = process.argv.slice(2)
const base = (args.find((a) => !a.startsWith('--')) ?? 'http://localhost:3000').replace(/\/$/, '')
const withLighthouse = args.includes('--lighthouse')
const updateBaseline = args.includes('--update-baseline')
const host = new URL(base).host.replace(/[^a-z0-9.-]/gi, '-')
const baselineFile = `audits/baseline/${host}.json`

const RAW = ['seo-audit.json', 'geo-audit.json', 'media-audit.json', 'lighthouse-weekly.json']
for (const f of RAW) rmSync(f, { force: true })

const notes: string[] = []
function run(script: string, extra: string[] = []) {
  console.log(`\n▶ ${script} ${base}`)
  const r = spawnSync(process.execPath, [...(script.endsWith('.ts') ? ['node_modules/tsx/dist/cli.mjs'] : []), script, base, ...extra], { stdio: 'inherit' })
  // geo/media exit 1 on findings; the comparison below decides. A crash shows up as missing output.
  if (r.status !== 0) notes.push(`\`${script}\` خرج بالرمز ${r.status} (النتائج تُقرأ من ملفه).`)
}
const read = <T,>(f: string): T | null => (existsSync(f) ? (JSON.parse(readFileSync(f, 'utf8')) as T) : null)

run('scripts/seo-audit.ts')
run('scripts/geo-audit.ts')
run('scripts/media-audit.ts')
if (withLighthouse) run('scripts/lighthouse-weekly.mjs')

const seo = read<SeoJson>('seo-audit.json')
const geo = read<GeoJson>('geo-audit.json')
const media = read<MediaRow[]>('media-audit.json')
const lh = withLighthouse ? read<{ pages: LighthousePage[]; crux: string }>('lighthouse-weekly.json') : null
const missing = [!seo && 'seo', !geo && 'geo', !media && 'media', withLighthouse && !lh && 'lighthouse'].filter(Boolean)

const s = seo ? seoMetrics(seo) : { metrics: {}, statuses: {}, noindexInSitemap: [] }
const current: Snapshot = {
  base,
  date: new Date().toISOString(),
  metrics: { ...s.metrics, ...(geo ? geoMetrics(geo) : {}), ...(media ? mediaMetrics(media) : {}), ...(lh ? lighthouseMetrics(lh.pages) : {}) },
  statuses: s.statuses,
  noindexInSitemap: s.noindexInSitemap,
}
if (geo) {
  const failed = geo.rows.filter((r) => r.status !== 200 || r.block)
  const byPath = new Map<string, string[]>()
  for (const r of failed) byPath.set(r.path ?? '?', [...(byPath.get(r.path ?? '?') ?? []), `${r.crawler ?? '?'} ${r.block ?? r.status}`])
  for (const [p, v] of byPath) notes.push(`geo: \`${p}\` لم ترجع 200 لـ ${v.join('، ')}`)
}
if (lh) notes.push(`بيانات المستخدمين الحقيقية (CrUX): ${lh.crux}`)
if (missing.length) notes.push(`لم تُنتج بيانات: ${missing.join('، ')}`)

mkdirSync('audits/baseline', { recursive: true })
const baseline = read<Snapshot>(baselineFile)
const regressions = baseline ? compare(baseline, current) : []
if (!baseline && !missing.length) {
  writeFileSync(`audits/baseline/${host}.candidate.json`, JSON.stringify(current, null, 2) + '\n')
  notes.push(`لا يوجد خط أساس لـ \`${host}\`. كُتب مرشّح في \`audits/baseline/${host}.candidate.json\`، ويُعتمد بمراجعته ثم إعادة تسميته (أو \`--update-baseline\`).`)
}
if (updateBaseline) {
  if (missing.length) {
    console.error(`--update-baseline refused: no data from ${missing.join(', ')}`)
    process.exit(1)
  }
  writeFileSync(baselineFile, JSON.stringify(current, null, 2) + '\n')
  notes.push(`خط الأساس حُدّث: \`${baselineFile}\`.`)
}

writeFileSync('audits/weekly.json', JSON.stringify({ current, regressions, notes }, null, 2) + '\n')
writeFileSync('audits/WEEKLY.md', weeklyMarkdown(current, updateBaseline ? current : baseline, updateBaseline ? [] : regressions, notes))
console.log(`\naudit:weekly ${base}: ${Object.keys(current.metrics).length} metrics, ${regressions.length} regressions → audits/WEEKLY.md`)
process.exit(missing.length || (!updateBaseline && regressions.length) ? 1 : 0)

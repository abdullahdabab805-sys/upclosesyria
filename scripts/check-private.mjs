// Fails when Search Console or Bing data is tracked by git (SEO day 7). The repository is public, so
// that data lives only in the owner's private e-mail report (src/endpoints/seoReport.ts).
// Checks tracked file names, and data files (json, csv, tsv, md, txt, xlsx) for fields that only
// those APIs' responses carry. Source code and tests are not data files and may name the fields.
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

let files
try {
  files = execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8' }).split('\0').filter(Boolean)
} catch {
  console.log('check-private: not a git checkout, skipped')
  process.exit(0)
}

const NAME = /(^|\/)(content-import\/seo\/|[^/]*(gsc|search-console|searchconsole|search-report|bing-webmaster)[^/]*\.(json|csv|tsv|xlsx?|txt)$)/i
const DATA = /\.(json|csv|tsv|md|txt)$/i
const MARKERS = [/responseAggregationType/, /AvgImpressionPosition/, /"inspectionResult"/, /\bimpressions\b[\s\S]{0,200}\bposition\b[\s\S]{0,200}\bctr\b/i]

const hits = []
for (const f of files) {
  if (NAME.test(f)) hits.push(`${f}: file name looks like Search Console / Bing data`)
  else if (DATA.test(f)) {
    let text
    try {
      text = readFileSync(f, 'utf8')
    } catch {
      continue
    }
    const m = MARKERS.find((re) => re.test(text))
    if (m) hits.push(`${f}: contains ${m}`)
  }
}

if (hits.length) {
  console.error(`check-private: ${hits.length} tracked file(s) look like private search data:\n${hits.map((h) => `  ${h}`).join('\n')}`)
  process.exit(1)
}
console.log('check-private: clean')

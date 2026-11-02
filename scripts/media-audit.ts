// Images and videos audit (SEO day 6). Read-only: it only fetches pages and files.
//   npm run media:audit                                  → local production build on http://localhost:3000
//   npm run media:audit -- https://www.upclosesyria.com  → the deployed site
// Writes MEDIA-AUDIT.md (summary + per-page detail) and media-audit.json (raw data) in the project root.
// Measures each page in a phone viewport (Lighthouse's Moto G Power: 412×823, DPR 1.75) for the drawn
// size of every photo and the LCP element. Exit code 1 on a missing alt, an iframe before play, a
// lazy LCP image, a broken share/sitemap/JSON-LD image, or a VideoObject without its required fields.
import { writeFileSync } from 'node:fs'
import { chromium } from 'playwright'
import sharp from 'sharp'
import {
  altLanguageMismatch,
  descriptiveFileName,
  duplicateAlts,
  iframeCount,
  imgTags,
  jsonLd,
  ldImages,
  loadingIssues,
  shareImages,
  videoLdIssues,
  weakAlt,
  type ImgTag,
} from '../src/lib/mediaAudit'

const base = (process.argv[2] ?? 'http://localhost:3000').replace(/\/$/, '')
const PHONE = { viewport: { width: 412, height: 823 }, deviceScaleFactor: 1.75, isMobile: true, hasTouch: true }

async function sitemapImages(section: string): Promise<Map<string, string[]>> {
  const xml = await (await fetch(`${base}/sitemaps/${section}.xml`)).text().catch(() => '')
  const out = new Map<string, string[]>()
  for (const m of xml.matchAll(/<url><loc>([^<]+)<\/loc>([\s\S]*?)<\/url>/g)) {
    out.set(decodeURIComponent(new URL(m[1] ?? '').pathname), [...(m[2] ?? '').matchAll(/<image:loc>([^<]+)<\/image:loc>/g)].map((x) => x[1]!.replace(/&amp;/g, '&')))
  }
  return out
}

/** One page of each kind with photos or videos. Kinds the database has no page for are skipped. */
async function sample(maps: Map<string, string[]>[]): Promise<string[]> {
  const all = maps.flatMap((m) => [...m.keys()])
  const first = (re: RegExp) => all.find((p) => re.test(p))
  return [
    '/',
    '/en',
    '/cities/damascus',
    '/en/cities/damascus',
    '/cities/aleppo',
    first(/^\/inside\/(bloudan|بلودان)/) ?? first(/^\/inside\/./),
    first(/^\/seasons\/./),
    first(/^\/blog\/./),
    first(/^\/guides\/./),
    '/videos',
    '/en/videos',
  ].filter((p): p is string => !!p)
}

type FileFacts = { status: number; type: string; kb: number | null; w: number | null; h: number | null }
const files = new Map<string, Promise<FileFacts>>()

/** Status, type, weight and pixel size of an image URL (cached; same-origin paths resolved on base). */
function file(url: string): Promise<FileFacts> {
  const abs = new URL(url, base).href
  if (!files.has(abs)) {
    files.set(
      abs,
      (async () => {
        try {
          const res = await fetch(abs)
          const buf = Buffer.from(await res.arrayBuffer())
          const meta = res.ok ? await sharp(buf).metadata().catch(() => null) : null
          return { status: res.status, type: res.headers.get('content-type') ?? '', kb: Math.round(buf.length / 102.4) / 10, w: meta?.width ?? null, h: meta?.height ?? null }
        } catch {
          return { status: 0, type: 'unreachable from here', kb: null, w: null, h: null }
        }
      })(),
    )
  }
  return files.get(abs)!
}

type Drawn = { src: string; naturalW: number; drawnW: number; drawnH: number }
type PageRow = {
  path: string
  locale: 'ar' | 'en'
  imgs: (ImgTag & { weak: string | null; langMismatch: boolean; descriptive: boolean; file: FileFacts; drawn: Drawn | null })[]
  duplicates: string[]
  loading: string[]
  iframes: number
  lcp: { tag: string; src: string | null; ms: number } | null
  jsKb: number
  share: ReturnType<typeof shareImages> & { file: FileFacts | null }
  ld: { url: string; file: FileFacts }[]
  sitemap: { url: string; file: FileFacts }[]
  sitemapNotOnPage: string[]
  videoIssues: ReturnType<typeof videoLdIssues>
}

async function measure(page: import('playwright').Page, path: string) {
  await page.addInitScript(() => {
    const w = window as unknown as { __lcp: { el: Element | null; t: number } }
    w.__lcp = { el: null, t: 0 }
    new PerformanceObserver((l) => {
      const e = l.getEntries().at(-1) as PerformanceEntry & { element?: Element; startTime: number }
      if (e) w.__lcp = { el: e.element ?? null, t: e.startTime }
    }).observe({ type: 'largest-contentful-paint', buffered: true })
  })
  await page.goto(base + encodeURI(path), { waitUntil: 'load' })
  await page.waitForTimeout(800)
  const lcp = await page.evaluate(() => {
    const l = (window as unknown as { __lcp: { el: Element | null; t: number } }).__lcp
    if (!l.el) return null
    return { tag: l.el.tagName.toLowerCase(), src: l.el instanceof HTMLImageElement ? l.el.getAttribute('src') : null, ms: Math.round(l.t) }
  })
  // Scroll through the page so lazy images load and report their drawn size.
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 600) {
      window.scrollTo(0, y)
      await new Promise((r) => setTimeout(r, 60))
    }
  })
  await page.waitForTimeout(500)
  const drawn = await page.evaluate(() =>
    [...document.querySelectorAll('img')].map((i) => ({ src: i.getAttribute('src') ?? '', naturalW: i.naturalWidth, drawnW: Math.round(i.getBoundingClientRect().width), drawnH: Math.round(i.getBoundingClientRect().height) })),
  )
  // JavaScript fetched before any tap (compressed bytes on the wire, from Resource Timing).
  const jsBytes = await page.evaluate(() =>
    (performance.getEntriesByType('resource') as PerformanceResourceTiming[]).filter((r) => r.initiatorType === 'script' || /\.js(\?|$)/.test(r.name)).reduce((n, r) => n + (r.transferSize || r.encodedBodySize), 0),
  )
  return { lcp, drawn, jsKb: Math.round(jsBytes / 1024) }
}

async function main() {
  const maps = await Promise.all(['pages', 'cities', 'countryside', 'seasons', 'first-visit', 'blog', 'guides'].map(sitemapImages))
  const sitemapOf = (p: string) => maps.find((m) => m.has(p))?.get(p) ?? []
  const paths = await sample(maps)
  // CHROMIUM_PATH: a Chromium already on the machine when Playwright's own download is not installed.
  const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {})
  const rows: PageRow[] = []
  for (const path of paths) {
    const html = await (await fetch(base + encodeURI(path))).text()
    const locale = path.startsWith('/en') ? 'en' : 'ar'
    const tags = imgTags(html)
    const ctx = await browser.newContext(PHONE)
    const m = await measure(await ctx.newPage(), path)
    await ctx.close()
    const imgs = await Promise.all(
      tags.map(async (t) => ({
        ...t,
        weak: weakAlt(t.alt, t.src),
        langMismatch: altLanguageMismatch(t.alt, locale),
        descriptive: descriptiveFileName(t.src),
        file: await file(t.src),
        drawn: m.drawn.find((d) => d.src === t.src) ?? null,
      })),
    )
    const blocks = jsonLd(html)
    const share = shareImages(html)
    const sm = sitemapOf(path)
    const onPage = new Set(tags.map((t) => new URL(t.src, base).href))
    rows.push({
      path,
      locale,
      imgs,
      duplicates: duplicateAlts(tags),
      loading: loadingIssues(tags),
      iframes: iframeCount(html),
      lcp: m.lcp,
      jsKb: m.jsKb,
      share: { ...share, file: share.og ? await file(share.og) : null },
      ld: await Promise.all(ldImages(blocks).map(async (url) => ({ url, file: await file(url) }))),
      sitemap: await Promise.all(sm.map(async (url) => ({ url, file: await file(url) }))),
      sitemapNotOnPage: sm.filter((u) => !onPage.has(new URL(new URL(u).pathname + new URL(u).search, base).href) && !onPage.has(u)),
      videoIssues: videoLdIssues(blocks),
    })
  }
  await browser.close()
  writeFileSync('media-audit.json', JSON.stringify(rows, null, 2))
  writeFileSync('MEDIA-AUDIT.md', report(rows))
  const fail = rows.some(
    (r) =>
      r.imgs.some((i) => i.alt === null) ||
      r.iframes > 0 ||
      r.loading.some((l) => l.startsWith('LCP image lazy')) ||
      (r.share.file && r.share.file.status !== 200) ||
      r.ld.some((x) => x.file.status !== 200 && x.file.status !== 0) ||
      r.sitemap.some((x) => x.file.status !== 200 && x.file.status !== 0) ||
      r.videoIssues.length > 0,
  )
  console.log(`MEDIA-AUDIT.md written: ${rows.length} pages, ${files.size} files.`)
  process.exit(fail ? 1 : 0)
}

const ok = (f: FileFacts | null) => (!f ? '—' : f.status === 200 ? '✅' : f.status === 0 ? '⚪ لم يُفحص من هنا' : `❌ ${f.status}`)
const short = (s: string) => {
  const p = s.replace(/^https?:\/\/[^/]+/, '')
  return p.length > 60 ? `…${p.slice(-57)}` : p
}

function report(rows: PageRow[]): string {
  const allImgs = rows.flatMap((r) => r.imgs.map((i) => ({ ...i, path: r.path })))
  const oversize = allImgs.filter((i) => i.drawn && i.drawn.naturalW > 0 && i.drawn.drawnW > 0 && i.drawn.naturalW > i.drawn.drawnW * 1.75 * 1.5)
  const ext = allImgs.filter((i) => i.file.status === 0).length
  const lines = [
    '# MEDIA-AUDIT — الصور والفيديو',
    '',
    `> \`npm run media:audit -- ${base}\` · ${new Date().toISOString().slice(0, 10)} · ${rows.length} صفحات · هاتف 412×823 بكثافة 1.75`,
    '',
    '## الخلاصة',
    '',
    `- صور في HTML الأولي: **${allImgs.length}** (منها ${allImgs.filter((i) => i.alt === '').length} زخرفية \`alt=""\`)`,
    `- بلا alt: **${allImgs.filter((i) => i.alt === null).length}** · alt ضعيف (اسم ملف، عام، طويل): **${allImgs.filter((i) => i.weak && i.alt !== null).length}** · بغير لغة الصفحة: **${allImgs.filter((i) => i.langMismatch).length}**`,
    `- alt مكرّر لصور مختلفة في الصفحة نفسها: **${rows.reduce((n, r) => n + r.duplicates.length, 0)}**`,
    `- بلا أبعاد (تسبب CLS): **${rows.reduce((n, r) => n + r.loading.filter((l) => l.startsWith('no width')).length, 0)}** · صورة LCP بـ lazy: **${rows.reduce((n, r) => n + r.loading.filter((l) => l.startsWith('LCP image lazy')).length, 0)}**`,
    `- صور تُنزَّل بأكبر من 1.5× ما تحتاجه الشاشة: **${oversize.length}**`,
    `- أسماء ملفات غير وصفية: **${allImgs.filter((i) => !i.descriptive).length}**`,
    `- iframe فيديو في HTML الأولي: **${rows.reduce((n, r) => n + r.iframes, 0)}** · VideoObject ناقص: **${rows.reduce((n, r) => n + r.videoIssues.length, 0)}**`,
    `- صور خارجية لم تُفحص من هذه البيئة: ${ext}`,
    '',
    '## لكل صفحة',
    '',
    '| الصفحة | صور | بلا alt / ضعيف / لغة | عنصر LCP (هاتف) | مشكلات التحميل | OG | صور JSON-LD | صور الـ sitemap | iframe | JS (KB) |',
    '| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |',
    ...rows.map((r) => {
      const lcp = r.lcp ? `${r.lcp.tag}${r.lcp.src ? ` \`${short(r.lcp.src)}\`` : ''} · ${r.lcp.ms}ms` : '—'
      const bad = (xs: { file: FileFacts }[]) => (xs.length ? `${xs.filter((x) => x.file.status === 200).length}/${xs.length}` : '—')
      return `| \`${r.path}\` | ${r.imgs.length} | ${r.imgs.filter((i) => i.alt === null).length} / ${r.imgs.filter((i) => i.weak && i.alt !== null).length} / ${r.imgs.filter((i) => i.langMismatch).length} | ${lcp} | ${r.loading.length || '—'} | ${ok(r.share.file)}${r.share.ogAlt ? '' : ' بلا alt'} | ${bad(r.ld)} | ${bad(r.sitemap)} | ${r.iframes} | ${r.jsKb} |`
    }),
    '',
    '## الصور الأثقل من حاجتها',
    '',
    '| الصفحة | الصورة | عرضها الأصلي | تُرسم بعرض (CSS px) | الحجم |',
    '| --- | --- | --- | --- | --- |',
    ...oversize.slice(0, 30).map((i) => `| \`${i.path}\` | \`${short(i.src)}\` | ${i.drawn!.naturalW} | ${i.drawn!.drawnW} | ${i.file.kb ?? '?'} KB |`),
    '',
    '## alt ضعيف أو بغير لغة الصفحة',
    '',
    '| الصفحة | الصورة | alt الحالي | المشكلة |',
    '| --- | --- | --- | --- |',
    ...allImgs.filter((i) => (i.weak && i.alt !== '') || i.langMismatch).slice(0, 60).map((i) => `| \`${i.path}\` | \`${short(i.src)}\` | ${i.alt === null ? '(مفقود)' : i.alt.replace(/\|/g, '/')} | ${[i.weak, i.langMismatch ? 'لغة' : null].filter(Boolean).join('، ')} |`),
    '',
    '## alt مكرّر في الصفحة نفسها',
    '',
    ...rows.filter((r) => r.duplicates.length).map((r) => `- \`${r.path}\`: ${r.duplicates.map((d) => `«${d}»`).join('، ')}`),
    '',
    '## الفيديو',
    '',
    ...rows.filter((r) => r.path.endsWith('/videos')).map((r) => `- \`${r.path}\`: iframe قبل التشغيل ${r.iframes}، JavaScript ${r.jsKb}KB، VideoObject ناقص: ${r.videoIssues.map((v) => `${v.id} (${v.missing.join('، ')})`).join('؛ ') || 'لا شيء'}`),
    '',
    '## صور الـ sitemap غير الظاهرة في الصفحة',
    '',
    ...rows.filter((r) => r.sitemapNotOnPage.length).map((r) => `- \`${r.path}\`: ${r.sitemapNotOnPage.map(short).join('، ')}`),
    '',
  ]
  return lines.join('\n')
}

void main()

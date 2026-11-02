// SEO day 6: images and videos. Same rules as `npm run media:audit` (src/lib/mediaAudit), on the
// hermetic production build.
import { expect, test } from '@playwright/test'
import sharp from 'sharp'
import { iframeCount, imgTags, jsonLd, shareImages, videoLdIssues } from '../src/lib/mediaAudit'
import { FORBIDDEN_META } from '../src/lib/seoAudit'

const PAGES = ['/', '/cities/damascus', '/en/cities/damascus', '/inside/bloudan']
// Pages whose top photo is the LCP element (Lighthouse 2026-10-27).
const LCP_PAGES = ['/cities/damascus', '/inside/bloudan']

test('every image has an alt (or alt="" when decorative), a box that cannot shift the layout, and no price or safety words', async ({ request }) => {
  for (const path of PAGES) {
    const imgs = imgTags(await (await request.get(encodeURI(path))).text())
    expect(imgs.length, path).toBeGreaterThan(0)
    for (const i of imgs) {
      expect(i.alt, `${path} ${i.src}`).not.toBeNull()
      expect(i.fill || (i.width !== null && i.height !== null), `${path} ${i.src} has no box`).toBe(true)
      expect(i.alt ?? '', `${path} ${i.src}`).not.toMatch(FORBIDDEN_META)
    }
  }
})

test('the LCP photo is fetched first and never lazy; our photos offer the 560px copy', async ({ request }) => {
  for (const path of LCP_PAGES) {
    const imgs = imgTags(await (await request.get(encodeURI(path))).text())
    const high = imgs.filter((i) => i.fetchPriority === 'high')
    expect(high, path).toHaveLength(1)
    expect(high[0]!.loading, path).not.toBe('lazy')
    const guide = imgs.filter((i) => /^\/guide\/[^/]+\.webp$/.test(i.src))
    for (const i of guide) expect(i.srcset, `${path} ${i.src}`).toContain(`/guide/sm/${i.src.slice('/guide/'.length)} 560w`)
    for (const i of guide.slice(0, 3)) {
      const res = await request.get(`/guide/sm/${i.src.slice('/guide/'.length)}`)
      expect(res.status(), i.src).toBe(200)
      expect(res.headers()['content-type']).toContain('image/')
    }
  }
})

test('the share image of a city page is a real 1200×630 image', async ({ request }) => {
  const og = shareImages(await (await request.get('/cities/damascus')).text()).og
  expect(og).toBeTruthy()
  const res = await request.get(new URL(og!).pathname)
  expect(res.status()).toBe(200)
  const meta = await sharp(await res.body()).metadata()
  expect([meta.width, meta.height]).toEqual([1200, 630])
})

test('sitemap images return images', async ({ request }) => {
  const xml = await (await request.get('/sitemaps/cities.xml')).text()
  const local = [...new Set([...xml.matchAll(/<image:loc>([^<]+)<\/image:loc>/g)].map((m) => new URL(m[1]!.replace(/&amp;/g, '&'))).filter((u) => u.pathname.startsWith('/guide/')).map((u) => u.pathname))]
  expect(local.length).toBeGreaterThan(0)
  for (const p of local.slice(0, 10)) {
    const res = await request.get(p)
    expect(res.status(), p).toBe(200)
    expect(res.headers()['content-type'], p).toContain('image/')
  }
})

test('videos: no player in the first HTML, and no VideoObject without its required fields', async ({ request }) => {
  for (const path of ['/videos', '/en/videos']) {
    const html = await (await request.get(path)).text()
    expect(iframeCount(html), path).toBe(0)
    expect(videoLdIssues(jsonLd(html)), path).toEqual([])
  }
})

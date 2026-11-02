import { existsSync, readdirSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import manifest from '@/content/photos.json'
import { photoAlt } from '@/content/photos'
import imageLoader from '@/lib/imageLoader'
import { GUIDE_SMALL_WIDTH, resizable } from '@/lib/guideImages'
import { videoObjectsLd } from '@/lib/jsonld'
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
} from '@/lib/mediaAudit'

const page = (head: string, body: string) => `<!DOCTYPE html><html><head>${head}</head><body>${body}<script>var x='<img src="/nope.webp">'</script></body></html>`

describe('imgTags', () => {
  it('reads every <img> outside scripts and noscript, with the attributes that matter', () => {
    const html = page(
      '',
      '<img alt="فناء بيت" loading="lazy" width="64" height="64" src="/guide/a.webp" sizes="64px" srcset="/guide/sm/a.webp 560w"/>' +
        '<img alt="" data-nimg="fill" fetchpriority="high" src="/b.webp"/><img src="/c.webp"/><noscript><img src="/d.webp"/></noscript>',
    )
    const imgs = imgTags(html)
    expect(imgs.map((i) => i.src)).toEqual(['/guide/a.webp', '/b.webp', '/c.webp'])
    expect(imgs[0]).toMatchObject({ alt: 'فناء بيت', width: 64, height: 64, fill: false, loading: 'lazy', sizes: '64px', srcset: '/guide/sm/a.webp 560w' })
    expect(imgs[1]).toMatchObject({ alt: '', fill: true, fetchPriority: 'high', width: null })
    expect(imgs[2]?.alt).toBeNull()
  })

  it('reads a page without a <body> as a fragment', () => {
    expect(imgTags('<img alt="x" src="/x.webp">')).toHaveLength(1)
  })
})

describe('iframeCount', () => {
  it('counts players in the first HTML only', () => {
    expect(iframeCount(page('', '<iframe src="https://www.youtube-nocookie.com/embed/x"></iframe>'))).toBe(1)
    expect(iframeCount(page('', '<script>"<iframe>"</script>'))).toBe(0)
  })
})

describe('shareImages', () => {
  it('reads og:image with its alt and size, and twitter:image', () => {
    const head =
      '<meta property="og:image" content="https://x.org/og.png"/><meta property="og:image:alt" content="دمشق"/><meta property="og:image:width" content="1200"/>' +
      '<meta property="og:image:height" content="630"/><meta name="twitter:image" content="https://x.org/tw.png"/>'
    expect(shareImages(page(head, ''))).toEqual({ og: 'https://x.org/og.png', ogAlt: 'دمشق', ogWidth: 1200, ogHeight: 630, twitter: 'https://x.org/tw.png' })
    expect(shareImages(page('', '')).og).toBeNull()
  })
})

describe('JSON-LD images and videos', () => {
  const html = page(
    '',
    '<script type="application/ld+json">{"@graph":[{"@type":"WebPage","image":"https://x.org/a.webp","logo":"/rel.png"},{"@type":"VideoObject","@id":"#v-1","name":"n","thumbnailUrl":"https://x.org/t.jpg","contentUrl":"https://www.youtube.com/watch?v=1"},{"@type":"VideoObject","name":"ok","thumbnailUrl":"https://x.org/u.jpg","uploadDate":"2026-01-02"}]}</script>' +
      '<script type="application/ld+json">{broken</script><script type="application/ld+json">[{"@type":"Article","image":["https://x.org/b.jpg","https://x.org/a.webp"],"video":{"contentUrl":"https://x.org/v.mp4"}}]</script>',
  )
  const blocks = jsonLd(html)

  it('parses every block and skips one that is broken', () => {
    expect(blocks).toHaveLength(2)
  })

  it('collects absolute image URLs once, and ignores a contentUrl that is not an image', () => {
    expect(ldImages(blocks)).toEqual(['https://x.org/a.webp', 'https://x.org/t.jpg', 'https://x.org/u.jpg', 'https://x.org/b.jpg'])
  })

  it('names the VideoObjects missing what Google requires', () => {
    expect(videoLdIssues(blocks)).toEqual([{ id: '#v-1', missing: ['uploadDate'] }])
    expect(videoLdIssues([{ '@type': 'VideoObject' }])).toEqual([{ id: '?', missing: ['name', 'thumbnailUrl', 'uploadDate'] }])
  })
})

describe('alt text checks', () => {
  it('flags missing, blank, file-name, generic and over-long alts; decorative and real ones pass', () => {
    expect(weakAlt(null, '/a.webp')).toBe('missing')
    expect(weakAlt('', '/a.webp')).toBeNull()
    expect(weakAlt('  ', '/a.webp')).toBe('blank')
    expect(weakAlt('u-house-0', '/guide/u-house-0.webp?x=1')).toBe('file name')
    expect(weakAlt('صورة', '/a.webp')).toBe('generic')
    expect(weakAlt('IMG_1234', '/a.webp')).toBe('generic')
    expect(weakAlt('ا'.repeat(126), '/a.webp')).toBe('too long')
    expect(weakAlt('فناء بيت دمشقي ببحرة ونباتات', '/a.webp')).toBeNull()
  })

  it('spots an alt in the other language', () => {
    expect(altLanguageMismatch('فناء بيت', 'en')).toBe(true)
    expect(altLanguageMismatch('A courtyard', 'ar')).toBe(true)
    expect(altLanguageMismatch('Courtyard · فناء', 'en')).toBe(false)
    expect(altLanguageMismatch('', 'en')).toBe(false)
    expect(altLanguageMismatch(null, 'ar')).toBe(false)
  })

  it('tells descriptive file names from hashes and camera numbers', () => {
    expect(descriptiveFileName('/guide/u-damascus-new-0.webp')).toBe(true)
    expect(descriptiveFileName('https://thumb.wikimedia.org/x/800px-Aleppo_Citadel.jpg')).toBe(true)
    expect(descriptiveFileName('https://b.blob.vercel-storage.com/fee7e71c-721e-4ee6-8edd-4619d12e3237.webp')).toBe(false)
    expect(descriptiveFileName('/IMG_20240101.jpg')).toBe(false)
  })

  it('lists an alt shared by two different photos, not one photo shown twice', () => {
    expect(
      duplicateAlts([
        { alt: 'سوق', src: '/a' },
        { alt: 'سوق', src: '/b' },
        { alt: 'قلعة', src: '/c' },
        { alt: 'قلعة', src: '/c' },
        { alt: '', src: '/d' },
        { alt: '', src: '/e' },
      ]),
    ).toEqual(['سوق'])
  })
})

describe('loadingIssues', () => {
  const img = (o: Partial<Parameters<typeof loadingIssues>[0][number]>) => ({ src: '/a', alt: '', width: 1, height: 1, fill: false, loading: null, fetchPriority: null, sizes: null, srcset: null, ...o })
  it('flags a lazy LCP image, two high-priority images and images without a box', () => {
    expect(loadingIssues([img({ fetchPriority: 'high', loading: 'lazy', src: '/h' }), img({ fetchPriority: 'high' }), img({ width: null, src: '/n' }), img({ fill: true, width: null, height: null })])).toEqual([
      '2 images with fetchpriority=high',
      'LCP image lazy: /h',
      'no width/height: /n',
    ])
    expect(loadingIssues([img({})])).toEqual([])
  })
})

describe('imageLoader', () => {
  it('serves the 560px copy of a guide photo when that width is enough, the original above it', () => {
    expect(imageLoader({ src: '/guide/u-house-0.webp', width: 560 })).toBe('/guide/sm/u-house-0.webp')
    expect(imageLoader({ src: '/guide/u-house-0.webp', width: 1280 })).toBe('/guide/u-house-0.webp')
  })
  it('leaves every other file alone', () => {
    for (const src of ['/photos/shawarma-plate.jpg', 'https://thumb.wikimedia.org/a.jpg', '/guide/sm/u-house-0.webp', '/api/media/file/a.webp']) {
      expect(imageLoader({ src, width: 200 })).toBe(src)
      expect(resizable(src)).toBe(false)
    }
    expect(resizable('/guide/u-house-0.webp')).toBe(true)
  })
  it('matches the copies on disk: every local guide photo has one, made at the loader width', async () => {
    const local = Object.values(manifest as Record<string, { src: string }>).filter((p) => p.src.startsWith('/guide/'))
    for (const p of local) expect(existsSync(`public/guide/sm/${p.src.slice('/guide/'.length)}`), p.src).toBe(true)
    expect(readdirSync('public/guide/sm').length).toBeGreaterThanOrEqual(new Set(local.map((p) => p.src)).size)
    const sharp = (await import('sharp')).default
    const meta = await sharp(`public/guide/sm/${local[0]!.src.slice('/guide/'.length)}`).metadata()
    expect(meta.width).toBeLessThanOrEqual(GUIDE_SMALL_WIDTH)
  })
})

describe('photoAlt', () => {
  it('gives the approved description in the page language, or null', () => {
    expect(photoAlt({ alt: { ar: 'فناء', en: 'A courtyard' } }, 'en')).toBe('A courtyard')
    expect(photoAlt({ alt: { ar: 'فناء', en: ' ' } }, 'en')).toBeNull()
    expect(photoAlt({}, 'ar')).toBeNull()
    expect(photoAlt(null, 'ar')).toBeNull()
  })
})

describe('videoObjectsLd', () => {
  const v = { anchor: 'v-1', name: 'حلب', author: 'صانع', thumbnail: '/t.webp', embedUrl: 'https://www.youtube-nocookie.com/embed/x', uploadDate: '2025-05-01', duration: 'PT3M' }
  it('describes a video with its real upload date, absolute thumbnail and player, and no contentUrl', () => {
    expect(videoObjectsLd({ base: 'https://x.org', path: '/videos', videos: [v] })).toEqual({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'VideoObject',
          '@id': 'https://x.org/videos#v-1',
          url: 'https://x.org/videos#v-1',
          name: 'حلب',
          thumbnailUrl: 'https://x.org/t.webp',
          uploadDate: '2025-05-01',
          duration: 'PT3M',
          embedUrl: 'https://www.youtube-nocookie.com/embed/x',
          creator: { '@type': 'Person', name: 'صانع' },
        },
      ],
    })
  })
  it('leaves out a video without its original date or thumbnail, and prints nothing when none is left', () => {
    const ld = videoObjectsLd({ base: 'https://x.org', path: '/videos', videos: [v, { ...v, anchor: 'v-2', uploadDate: null }, { ...v, anchor: 'v-3', thumbnail: undefined, duration: undefined }] })
    expect(ld?.['@graph'].map((n) => n['@id'])).toEqual(['https://x.org/videos#v-1'])
    expect(videoObjectsLd({ base: 'https://x.org', path: '/videos', videos: [{ ...v, uploadDate: undefined }] })).toBeNull()
  })
})

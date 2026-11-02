import sharp from 'sharp'
import { describe, expect, it } from 'vitest'
import { OG_SIZE, renderOg } from '@/og/render'

describe('renderOg', () => {
  it('produces a 1200×630 PNG on the light paper with green text on it', async () => {
    const png = await renderOg({ kicker: 'المدن', title: 'دمشق', subtitle: 'حارات ضيقة' })
    const img = sharp(png)
    const meta = await img.metadata()
    expect(meta.format).toBe('png')
    expect({ width: meta.width, height: meta.height }).toEqual(OG_SIZE)
    const { channels } = await img.stats()
    // Mostly paper (#FBF8F2) background, with dark green text pixels present.
    expect(Math.round(channels[0]!.mean)).toBeGreaterThan(200)
    expect(channels[0]!.min).toBeLessThan(40)
    // Renders on one libvips thread by design (src/og/render.ts); under coverage load that takes
    // longer than vitest's default 5s. The assertions are unchanged.
  }, 20_000)
})

describe('photo share card (SEO day 6)', () => {
  it('puts the photo above a sand band with the logo, as a light JPEG of 1200×630', async () => {
    const { renderPhotoOg } = await import('@/og/render')
    const photo = await sharp({ create: { width: 800, height: 1000, channels: 3, background: '#2050a0' } }).png().toBuffer()
    const jpg = await renderPhotoOg(photo)
    const meta = await sharp(jpg).metadata()
    expect(meta.format).toBe('jpeg')
    expect({ width: meta.width, height: meta.height }).toEqual(OG_SIZE)
    expect(jpg.length).toBeLessThan(300_000)
    // Top: the photo (blue). Bottom-left corner: the sand band (#E8DCC8).
    const px = async (left: number, top: number) => [...(await sharp(jpg).extract({ left, top, width: 1, height: 1 }).raw().toBuffer())]
    const [r, , b] = await px(600, 200)
    expect(b! - r!).toBeGreaterThan(80)
    const sand = await px(20, 600)
    const SAND = [0xe8, 0xdc, 0xc8]
    SAND.forEach((c, i) => expect(Math.abs(sand[i]! - c)).toBeLessThan(12))
  }, 20_000)
})

describe('pickCover and ogCard', () => {
  it('prefers the correspondent cover (largest stored size, alt in the page language), then guide photos in order', async () => {
    const { pickCover } = await import('@/og/cover')
    const media = { id: 1, alt: { ar: 'باب', en: 'A door' }, url: '/api/media/file/a.webp', sizes: { hero: { url: '/api/media/file/a-1600.webp' } } }
    expect(pickCover(media as never, ['u-house-0'], 'en')).toEqual({ url: '/api/media/file/a-1600.webp', alt: 'A door' })
    expect(pickCover(null, [null, 'no-such-photo', 'u-damascus-new-0'], 'ar')).toEqual({ url: '/guide/u-damascus-new-0.webp', alt: expect.stringContaining('الجامع الأموي') })
    expect(pickCover(7, ['no-such-photo'], 'ar')).toBeNull()
  })

  it('falls back to the text card, as a JPEG, when there is no photo or it does not load', async () => {
    const { ogCard, ogAlt } = await import('@/og/cover')
    for (const cover of [null, { url: 'http://127.0.0.1:9/missing.webp', alt: 'x' }]) {
      const meta = await sharp(await ogCard(cover, { title: 'دمشق' })).metadata()
      expect([meta.format, meta.width, meta.height]).toEqual(['jpeg', 1200, 630])
    }
    expect(ogAlt({ url: '/a', alt: 'فناء' }, 'دمشق')).toBe('فناء')
    expect(ogAlt({ url: '/a', alt: null }, 'دمشق')).toBe('دمشق')
    expect(ogAlt(null, 'دمشق')).toBe('دمشق')
  }, 30_000)
})

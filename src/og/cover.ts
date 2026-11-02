import { asMedia } from '@/lib/docs'
import type { Locale } from '@/lib/i18n'
import { text } from '@/lib/localized'
import { siteUrl } from '@/lib/site-url'
import { photoAlt, staticPhoto } from '@/content/photos'
import type { Media } from '@/payload-types'
import { renderOg, renderPhotoOg, type OgCard } from '@/og/render'

/** The photo a page's share card is made from: the same one the page shows on top (its LCP photo). */
export type OgCover = { url: string; alt: string | null }

/**
 * A correspondent's cover (Payload, its largest stored size) when there is one, else the first guide
 * photo that exists among `fallbackKeys`, the order the page itself uses. Null when there is none.
 */
export function pickCover(media: Media | number | null | undefined, fallbackKeys: readonly (string | null | undefined)[], locale: Locale): OgCover | null {
  const m = asMedia(media)
  const url = m?.sizes?.hero?.url ?? m?.url
  if (m && url) return { url, alt: text(m.alt, locale) }
  for (const key of fallbackKeys) {
    const sp = staticPhoto(key ?? undefined)
    if (sp) return { url: sp.full ?? sp.src, alt: photoAlt(sp, locale) }
  }
  return null
}

/** The photo's bytes: same-origin paths through the site's own address (public files are not in the function bundle). */
async function load(url: string): Promise<Buffer | null> {
  try {
    const res = await fetch(new URL(url, siteUrl()), { signal: AbortSignal.timeout(6000) })
    return res.ok ? Buffer.from(await res.arrayBuffer()) : null
  } catch {
    return null
  }
}

/** The share card: the cover photo when it loads, otherwise the text card (as before day 6). JPEG either way. */
export async function ogCard(cover: OgCover | null, card: OgCard): Promise<Buffer> {
  const photo = cover ? await load(cover.url) : null
  if (photo) {
    try {
      return await renderPhotoOg(photo)
    } catch {
      // A file sharp cannot read: fall back to the text card.
    }
  }
  const sharp = (await import('sharp')).default
  return sharp(await renderOg(card)).jpeg({ quality: 88 }).toBuffer()
}

/** og:image:alt: what the photo shows, else the card's own words. */
export const ogAlt = (cover: OgCover | null, fallback: string) => cover?.alt ?? fallback

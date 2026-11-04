import manifest from './photos.json'

/**
 * A guide photo: the owner's own collection (public/guide or Blob) or a free-licensed file from
 * Wikimedia Commons / Flickr loaded straight from its host. `full` is the larger size for the
 * lightbox, `year` the year it was taken when the source says so (older shots are marked archival).
 */
export type StaticPhoto = { src: string; w: number; h: number; credit: string; href: string | null; full?: string; year?: number | null; archive?: boolean; alt?: { ar: string; en: string } }

const PHOTOS = manifest as Record<string, StaticPhoto>

/**
 * What the photo shows, in the page's language (SEO day 6, written from the photo itself and approved by
 * the owner in ALT-TEXT.md). null until a photo has one: callers then keep their own neutral caption.
 */
export const photoAlt = (p: Pick<StaticPhoto, 'alt'> | null | undefined, locale: 'ar' | 'en'): string | null => p?.alt?.[locale]?.trim() || null

export const staticPhoto = (key: string | undefined): StaticPhoto | null => (key ? (PHOTOS[key] ?? null) : null)

/** Photos taken before this year are labelled archival: the site shows Syria as it is today. */
export const ARCHIVE_BEFORE = 2015

/**
 * "صورة أرشيفية · 2009" for an old photo, null otherwise. `archive` marks a photo that shows what no longer
 * stands (a monument destroyed, a bridge fallen) when its source gives no year: the label without one.
 */
export function archiveLabel(p: Pick<StaticPhoto, 'year' | 'archive'> | null | undefined, locale: 'ar' | 'en'): string | null {
  const word = locale === 'ar' ? 'صورة أرشيفية' : 'Archive photo'
  if (p?.year && p.year < ARCHIVE_BEFORE) return `${word} · ${p.year}`
  return p?.archive ? word : null
}

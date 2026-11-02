// Images and videos as a crawler and a phone get them (SEO day 6). Used by `npm run media:audit` and
// the e2e media tests, so both judge pages the same way. Plain string parsing of Next's own output,
// like lib/seoAudit and lib/geoAudit.
import { decodeEntities } from '@/lib/seoAudit'

export type ImgTag = {
  src: string
  /** null: the attribute is missing. "": decorative. */
  alt: string | null
  width: number | null
  height: number | null
  /** next/image `fill`: sized by its positioned box, so it cannot shift the layout. */
  fill: boolean
  loading: string | null
  fetchPriority: string | null
  sizes: string | null
  srcset: string | null
}

function attr(tag: string, name: string): string | null {
  const m = tag.match(new RegExp(`\\s${name}="([^"]*)"`, 'i'))
  return m ? decodeEntities(m[1] ?? '') : null
}

const num = (v: string | null) => (v && /^\d+$/.test(v) ? Number(v) : null)

/** The body without scripts, styles and <noscript> (Next repeats some images there). */
function body(html: string): string {
  const b = html.match(/<body\b[\s\S]*<\/body>/i)?.[0] ?? html
  return b.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '').replace(/<noscript[\s\S]*?<\/noscript>/gi, '')
}

/** Every <img> in the first HTML, in document order. */
export function imgTags(html: string): ImgTag[] {
  return [...body(html).matchAll(/<img\b[^>]*>/gi)].map(({ 0: t }) => ({
    src: attr(t, 'src') ?? '',
    alt: attr(t, 'alt'),
    width: num(attr(t, 'width')),
    height: num(attr(t, 'height')),
    fill: attr(t, 'data-nimg') === 'fill',
    loading: attr(t, 'loading'),
    fetchPriority: attr(t, 'fetchpriority') ?? attr(t, 'fetchPriority'),
    sizes: attr(t, 'sizes'),
    srcset: attr(t, 'srcset'),
  }))
}

/** <iframe> elements in the first HTML: a video player there loads before anyone presses play. */
export const iframeCount = (html: string) => [...body(html).matchAll(/<iframe\b/gi)].length

/** og:image / twitter:image with their alt text. */
export function shareImages(html: string): { og: string | null; ogAlt: string | null; ogWidth: number | null; ogHeight: number | null; twitter: string | null } {
  const head = html.match(/<head[\s\S]*?<\/head>/i)?.[0] ?? ''
  const metas = [...head.matchAll(/<meta\b[^>]*>/gi)].map((m) => m[0])
  const get = (k: string) => attr(metas.find((t) => attr(t, 'property') === k || attr(t, 'name') === k) ?? '', 'content')
  return { og: get('og:image'), ogAlt: get('og:image:alt'), ogWidth: num(get('og:image:width')), ogHeight: num(get('og:image:height')), twitter: get('twitter:image') }
}

/** Every JSON-LD block on the page, parsed (blocks that fail to parse are skipped). */
export function jsonLd(html: string): unknown[] {
  return [...html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)].flatMap((m) => {
    try {
      return [JSON.parse(m[1] ?? '') as unknown]
    } catch {
      return []
    }
  })
}

/** Image URLs anywhere in the JSON-LD (image, thumbnailUrl, logo), de-duplicated. */
export function ldImages(blocks: unknown[]): string[] {
  const out = new Set<string>()
  const walk = (v: unknown, key?: string) => {
    if (typeof v === 'string') {
      if (key && /^(image|thumbnailUrl|logo|contentUrl)$/.test(key) && /^https?:\/\//.test(v) && (key !== 'contentUrl' || /\.(jpe?g|png|webp|avif|gif)(\?|$)/i.test(v))) out.add(v)
      return
    }
    if (Array.isArray(v)) return v.forEach((x) => walk(x, key))
    if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) walk(x, k)
  }
  blocks.forEach((b) => walk(b))
  return [...out]
}

export type VideoLdIssue = { id: string; missing: string[] }

/**
 * VideoObject nodes missing what Google requires (name, thumbnailUrl, uploadDate), and any that
 * claim an upload date the page has no source for is caught by the data, not here.
 * Source: developers.google.com/search/docs/appearance/structured-data/video (checked 2026-11-02).
 */
export function videoLdIssues(blocks: unknown[]): VideoLdIssue[] {
  const nodes: Record<string, unknown>[] = []
  const walk = (v: unknown) => {
    if (Array.isArray(v)) return v.forEach(walk)
    if (v && typeof v === 'object') {
      const o = v as Record<string, unknown>
      if (o['@type'] === 'VideoObject') nodes.push(o)
      Object.values(o).forEach(walk)
    }
  }
  blocks.forEach(walk)
  return nodes
    .map((n) => ({ id: String(n['@id'] ?? n.name ?? '?'), missing: ['name', 'thumbnailUrl', 'uploadDate'].filter((k) => !n[k]) }))
    .filter((r) => r.missing.length > 0)
}

/** Alt text a screen reader or a search engine cannot use. null when the alt is fine. */
export function weakAlt(alt: string | null, src: string): string | null {
  if (alt === null) return 'missing'
  if (alt === '') return null
  const a = alt.trim()
  const file = decodeURIComponent(src.split('?')[0]?.split('/').pop() ?? '').replace(/\.[a-z0-9]+$/i, '')
  if (!a) return 'blank'
  if (file && a.toLowerCase() === file.toLowerCase()) return 'file name'
  if (/^(image|img|photo|picture|صورة|صوره|untitled|dsc_?\d+|img_?\d+)$/i.test(a)) return 'generic'
  if (a.length > 125) return 'too long'
  return null
}

/** The page's language is English but the alt is Arabic only (or the reverse). */
export function altLanguageMismatch(alt: string | null, locale: 'ar' | 'en'): boolean {
  if (!alt) return false
  const arabic = /[\u0600-\u06FF]/.test(alt)
  const latin = /[A-Za-z]{3,}/.test(alt)
  return locale === 'en' ? arabic && !latin : latin && !arabic
}

/** A file name that says nothing about the photo (hashes, camera numbers). */
export function descriptiveFileName(src: string): boolean {
  const file = decodeURIComponent(src.split('?')[0]?.split('/').pop() ?? '').replace(/\.[a-z0-9]+$/i, '')
  const words = file.replace(/^\d+px-/, '').split(/[-_\s.]+/).filter((w) => /[a-z\u0600-\u06FF]{3,}/i.test(w) && !/^[a-f0-9]+$/i.test(w))
  return words.length > 0 && !/^(img|dsc|pxl|photo|image)$/i.test(words[0] ?? '')
}

/** Alt texts used by more than one different photo on the page (decorative ones excluded). */
export function duplicateAlts(imgs: Pick<ImgTag, 'alt' | 'src'>[]): string[] {
  const bySrc = new Map<string, Set<string>>()
  for (const i of imgs) if (i.alt) bySrc.set(i.alt, (bySrc.get(i.alt) ?? new Set()).add(i.src))
  return [...bySrc].filter(([, s]) => s.size > 1).map(([a]) => a)
}

/**
 * Loading problems a phone pays for: the page's high-priority image lazy-loaded, more than one image
 * asking for high priority, an image without a box (width/height or fill) that shifts the layout.
 */
export function loadingIssues(imgs: ImgTag[]): string[] {
  const out: string[] = []
  const high = imgs.filter((i) => i.fetchPriority === 'high')
  if (high.length > 1) out.push(`${high.length} images with fetchpriority=high`)
  for (const i of high) if (i.loading === 'lazy') out.push(`LCP image lazy: ${i.src}`)
  for (const i of imgs) if (!i.fill && (i.width === null || i.height === null)) out.push(`no width/height: ${i.src}`)
  return out
}

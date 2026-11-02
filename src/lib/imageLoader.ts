'use client'

import { guideSrc } from '@/lib/guideImages'

/**
 * next/image loader (SEO day 6). Vercel's optimizer stays off (owner decision 2026-10-29, the plan's
 * quota ran out), so nothing is resized on request. Instead the guide photos in public/guide have a
 * smaller copy made ahead of time in public/guide/sm (`npm run photos:variants`), and this loader picks
 * it whenever the browser asks for a width it covers (lib/guideImages). Everything else is already sized
 * (Payload's WebP sizes, Commons thumbnails) and is drawn `unoptimized`, so it never gets here.
 * The 'use client' line is what the Next docs ask of a loaderFile in the App Router (…/images.md).
 */
export default function imageLoader({ src, width }: { src: string; width: number; quality?: number }): string {
  return guideSrc(src, width)
}

// Our own guide photos in public/guide and their 560px copies in public/guide/sm (SEO day 6).
// Shared by the server components and the client-side image loader (lib/imageLoader), which cannot
// export plain functions to the server itself ('use client' modules expose components only).

/** Width of the copies in public/guide/sm (scripts/guide-variants.mjs). */
export const GUIDE_SMALL_WIDTH = 560

const GUIDE = /^\/guide\/([^/?#]+)\.webp$/

/** A photo the loader can serve smaller: one of ours in public/guide. */
export const resizable = (src: string) => GUIDE.test(src)

/** The URL for a requested width: the 560px copy when it is enough, else the original; other files unchanged. */
export function guideSrc(src: string, width: number): string {
  const m = GUIDE.exec(src)
  return m && width <= GUIDE_SMALL_WIDTH ? `/guide/sm/${m[1]}.webp` : src
}

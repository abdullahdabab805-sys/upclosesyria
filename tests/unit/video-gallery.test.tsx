import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { VideoGallery, type VideoCardData } from '@/components/client/VideoGallery'
import { videoText } from '@/lib/videoCards'

const card = (id: number): VideoCardData => ({ id, platform: 'youtube', videoId: `v${id}`, orientation: 'wide', title: `t${id}`, author: 'a', thumbnail: `https://i.ytimg.com/vi/v${id}/hq.jpg` })
const imgs = (html: string) => html.match(/<img[^>]*>/g) ?? []

describe('video gallery thumbnails (SEO day 10: /videos LCP)', () => {
  const videos = [1, 2, 3, 4].map(card)

  it('by default every thumbnail is lazy (galleries lower down a page, e.g. a city)', () => {
    const out = imgs(renderToStaticMarkup(<VideoGallery videos={videos} text={videoText('ar')} pagePath="/videos" />))
    expect(out).toHaveLength(4)
    for (const i of out) expect(i).toContain('loading="lazy"')
  })

  it('eagerFirst loads the leading thumbnails eagerly, only the first at high priority', () => {
    const out = imgs(renderToStaticMarkup(<VideoGallery videos={videos} text={videoText('ar')} pagePath="/videos" eagerFirst={2} />))
    expect(out[0]).not.toContain('loading="lazy"')
    expect(out[0]).toMatch(/fetchpriority="high"/i)
    expect(out[1]).not.toContain('loading="lazy"')
    expect(out[1]).not.toMatch(/fetchpriority="high"/i)
    expect(out[2]).toContain('loading="lazy"')
    expect(out[3]).toContain('loading="lazy"')
  })
})

describe('video gallery creator credit (SEO day 13)', () => {
  it("links the creator's name to their channel when known, and leaves it plain otherwise", () => {
    const html = renderToStaticMarkup(<VideoGallery videos={[{ ...card(1), author: 'Safartas', authorUrl: 'https://www.youtube.com/@safartas' }, { ...card(2), author: 'Plain' }]} text={videoText('ar')} pagePath="/videos" />)
    expect(html).toContain('<a href="https://www.youtube.com/@safartas" target="_blank" rel="noopener noreferrer">Safartas</a>')
    expect(html).not.toMatch(/<a [^>]*>Plain<\/a>/)
    expect(html).toContain('Plain')
  })
})

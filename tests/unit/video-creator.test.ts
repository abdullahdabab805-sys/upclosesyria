import { describe, expect, it } from 'vitest'
import { creatorUrlError, fetchCreatorUrl, isCreatorUrl } from '@/lib/videoCreator'
import { videoCreator } from '@/hooks/videoCreator'
import type { Fetcher } from '@/lib/videoCover'

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })
const seen: string[] = []
const fake =
  (res: () => Response): Fetcher =>
  async (u) => {
    seen.push(u)
    return res()
  }
const YT = 'https://www.youtube.com/watch?v=Whc4fSebZl4'

describe('isCreatorUrl / creatorUrlError', () => {
  it('accepts an https page on the platforms, and on the video’s own platform when one is given', () => {
    expect(isCreatorUrl('https://www.youtube.com/@safartas')).toBe(true)
    expect(isCreatorUrl('https://www.tiktok.com/@a', 'tiktok')).toBe(true)
    expect(isCreatorUrl('https://instagram.com/a', 'instagram')).toBe(true)
    expect(isCreatorUrl('https://www.youtube.com/@a', 'tiktok')).toBe(false)
    expect(isCreatorUrl('http://www.youtube.com/@a')).toBe(false)
    expect(isCreatorUrl('https://evil.example/@a')).toBe(false)
    expect(isCreatorUrl('javascript:alert(1)')).toBe(false)
    expect(isCreatorUrl('')).toBe(false)
    expect(isCreatorUrl(null)).toBe(false)
  })
  it('lets the field stay empty and refuses anything else', () => {
    expect(creatorUrlError('')).toBe(true)
    expect(creatorUrlError(null)).toBe(true)
    expect(creatorUrlError('https://www.youtube.com/@a')).toBe(true)
    expect(creatorUrlError('https://evil.example/a')).toMatch(/يوتيوب/)
  })
})

describe('fetchCreatorUrl', () => {
  it('reads author_url from YouTube’s oEmbed for the video', async () => {
    seen.length = 0
    expect(await fetchCreatorUrl({ platform: 'youtube', url: YT }, fake(() => json({ author_url: 'https://www.youtube.com/@safartas' })))).toBe('https://www.youtube.com/@safartas')
    expect(seen[0]).toBe(`https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(YT)}`)
  })
  it('asks TikTok’s oEmbed too, and never Instagram’s (it needs a token)', async () => {
    seen.length = 0
    expect(await fetchCreatorUrl({ platform: 'tiktok', url: 'https://www.tiktok.com/@a/video/123456789' }, fake(() => json({ author_url: 'https://www.tiktok.com/@a' })))).toBe('https://www.tiktok.com/@a')
    expect(await fetchCreatorUrl({ platform: 'instagram', url: 'https://www.instagram.com/p/abcde/' }, fake(() => json({})))).toBeNull()
    expect(seen).toHaveLength(1)
  })
  it('is null on an error, bad JSON, or a page off the platform', async () => {
    expect(await fetchCreatorUrl({ platform: 'youtube', url: YT }, fake(() => json({}, 404)))).toBeNull()
    expect(await fetchCreatorUrl({ platform: 'youtube', url: YT }, fake(() => new Response('not json')))).toBeNull()
    expect(await fetchCreatorUrl({ platform: 'youtube', url: YT }, fake(() => json({ author_url: 'https://evil.example/@x' })))).toBeNull()
  })
})

describe('videoCreator hook', () => {
  const warn: unknown[] = []
  const req = { payload: { logger: { warn: (x: unknown) => warn.push(x) } } } as never
  const run = (data: Record<string, unknown>, originalDoc: Record<string, unknown> | undefined, f: Fetcher) =>
    videoCreator(f)({ data, originalDoc, req } as never) as Promise<Record<string, unknown>>

  it('fills an empty creator page from the platform', async () => {
    const out = await run({ platform: 'youtube', url: YT }, undefined, fake(() => json({ author_url: 'https://www.youtube.com/@safartas' })))
    expect(out.authorUrl).toBe('https://www.youtube.com/@safartas')
  })
  it('keeps what the editor typed, and what was already saved, without asking the platform', async () => {
    seen.length = 0
    const f = fake(() => json({ author_url: 'https://www.youtube.com/@other' }))
    expect((await run({ platform: 'youtube', url: YT, authorUrl: 'https://www.youtube.com/@mine' }, undefined, f)).authorUrl).toBe('https://www.youtube.com/@mine')
    expect((await run({ title: 'x' }, { platform: 'youtube', url: YT, authorUrl: 'https://www.youtube.com/@saved' }, f)).authorUrl).toBeUndefined()
    expect(seen).toHaveLength(0)
  })
  it('never fails the save: a network error just leaves it empty', async () => {
    const out = await run({ platform: 'youtube', url: YT }, undefined, async () => {
      throw new Error('offline')
    })
    expect(out.authorUrl).toBeUndefined()
    expect(warn).toHaveLength(1)
  })
})

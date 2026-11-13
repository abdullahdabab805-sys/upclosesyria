import type { CollectionBeforeChangeHook } from 'payload'
import type { Platform } from '@/lib/video'
import type { Fetcher } from '@/lib/videoCover'
import { fetchCreatorUrl } from '@/lib/videoCreator'

/**
 * Videos beforeChange, after videoFromUrl: a video saved without its creator's page gets it from the
 * platform (YouTube, TikTok). What the editor typed always wins. Saving never fails over it.
 */
export const videoCreator =
  (fetcher?: Fetcher): CollectionBeforeChangeHook =>
  async ({ data, originalDoc, req }) => {
    const d = data as Record<string, unknown>
    const o = (originalDoc ?? {}) as Record<string, unknown>
    const given = 'authorUrl' in d ? d.authorUrl : o.authorUrl
    if (typeof given === 'string' && given.trim()) return d
    const platform = (d.platform ?? o.platform) as Platform | undefined
    const url = (d.url ?? o.url) as string | undefined
    if (!platform || !url) return d
    try {
      const authorUrl = await fetchCreatorUrl({ platform, url }, fetcher)
      return authorUrl ? { ...d, authorUrl } : d
    } catch (err) {
      req.payload.logger.warn({ msg: 'videoCreator: no creator page', err })
      return d
    }
  }

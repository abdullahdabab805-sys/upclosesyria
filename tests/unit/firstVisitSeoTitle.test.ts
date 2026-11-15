import { describe as group, expect, it } from 'vitest'
import { FIRST_VISIT, FIRST_VISIT_SEO_TITLE } from '@/lib/firstVisitTopics'
import { FORBIDDEN_META } from '@/lib/seoAudit'
import { len, topicRoom } from '@/lib/seoText'

group('first-visit search titles', () => {
  for (const { topic } of FIRST_VISIT) {
    for (const locale of ['ar', 'en'] as const) {
      const t = FIRST_VISIT_SEO_TITLE[topic][locale]
      it(`${topic} (${locale}) names the country and fits with the site name`, () => {
        expect(t).toMatch(locale === 'ar' ? /سوريا/ : /Syria/)
        expect(len(t)).toBeLessThanOrEqual(topicRoom(locale))
        expect(t).not.toMatch(FORBIDDEN_META)
      })
    }
  }
})

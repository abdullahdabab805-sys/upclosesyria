import { describe, expect, it } from 'vitest'
import { correctionHref, EDITOR_EMAIL } from '@/lib/brand'

describe('report a correction (SEO day 9)', () => {
  it('mails the editors with the page URL in the subject and body', () => {
    const href = correctionHref('https://x.org/cities/damascus', 'ar')
    expect(href.startsWith(`mailto:${EDITOR_EMAIL}?subject=`)).toBe(true)
    const q = new URLSearchParams(href.split('?')[1])
    expect(q.get('subject')).toBe('تصحيح: https://x.org/cities/damascus')
    expect(q.get('body')).toContain('الصفحة: https://x.org/cities/damascus')
  })
  it('English pages get an English message', () => {
    const q = new URLSearchParams(correctionHref('https://x.org/en/cities/aleppo', 'en', 'e@x.org').split('?')[1])
    expect(q.get('subject')).toBe('Correction: https://x.org/en/cities/aleppo')
  })
  it('encodes the address safely (no raw spaces or newlines in the link)', () => {
    expect(correctionHref('https://x.org/a b', 'ar')).not.toMatch(/[\s]/)
  })
})

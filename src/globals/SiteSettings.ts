import type { GlobalConfig } from 'payload'
import { adminOnly } from '@/access'
import { queueIndexNow } from '@/hooks/indexNow'
import { revalidateGlobal } from '@/hooks/revalidate'
import { httpsUrl } from '@/lib/validators'

const DISCLOSURE = { ar: 'أهلين شريك هذا الدليل.', en: 'Ahleen is this guide’s partner.' } as const

/** Partner link, the guide's social profiles and staleness limits (SPEC §5.2). UTM and discount settings land here later. */
export const SiteSettings: GlobalConfig = {
  slug: 'siteSettings',
  label: { ar: 'إعدادات الموقع', en: 'Site settings' },
  access: { read: () => true, update: adminOnly },
  hooks: {
    afterChange: [
      revalidateGlobal,
      // SEO day 19: the resorts hub's intro is here, so a save may change what that page shows.
      ({ doc, req }) => {
        queueIndexNow(req.payload, 'siteSettings', doc)
        return doc
      },
    ],
  },
  fields: [
    {
      type: 'collapsible',
      label: { ar: 'الشريك (أهلين)', en: 'Partner (Ahleen)' },
      fields: [
        {
          name: 'ahleenBaseUrl',
          type: 'text',
          required: true,
          defaultValue: 'https://ahleenbooking.com',
          label: { ar: 'رابط أهلين', en: 'Ahleen base URL' },
          validate: (v: unknown) => httpsUrl(v, { required: true }),
        },
        {
          name: 'partnerLinkRel',
          type: 'text',
          required: true,
          defaultValue: 'sponsored noopener',
          label: { ar: 'قيمة rel لروابط الشريك', en: 'Partner link rel' },
          validate: (v: unknown) =>
            (typeof v === 'string' && /^[a-z]+( [a-z]+)*$/.test(v) && v.split(' ').includes('noopener')) ||
            'كلمات صغيرة مفصولة بمسافة، ويجب أن تتضمن noopener',
        },
        {
          name: 'disclosureText',
          type: 'text',
          required: true,
          localized: true,
          defaultValue: ({ locale }: { locale?: string }) => (locale === 'en' ? DISCLOSURE.en : DISCLOSURE.ar),
          label: { ar: 'سطر الإفصاح', en: 'Disclosure line' },
        },
      ],
    },
    {
      // schema.org sameAs on the home page (Organization). Empty until the guide's accounts are added:
      // nothing is published for an empty list.
      name: 'socialProfiles',
      type: 'array',
      label: { ar: 'حسابات التواصل (sameAs)', en: 'Social profiles (sameAs)' },
      labels: { singular: { ar: 'حساب', en: 'Profile' }, plural: { ar: 'حسابات', en: 'Profiles' } },
      admin: { description: { ar: 'روابط حسابات سوريا عن قرب الرسمية فقط (إنستغرام، فيسبوك…). تظهر للمحركات في بيانات الصفحة الرئيسية.', en: "Only the guide's own accounts. Search engines read them from the home page's structured data." } },
      fields: [{ name: 'url', type: 'text', required: true, label: { ar: 'الرابط', en: 'URL' }, validate: (v: unknown) => httpsUrl(v, { required: true }) }],
    },
    {
      name: 'staleness',
      type: 'group',
      label: { ar: 'مهلة "قد تكون قديمة" (بالأيام)', en: 'Staleness limits (days)' },
      fields: [
        { name: 'statusDays', type: 'number', required: true, defaultValue: 7, min: 1, label: { ar: 'حال البلد', en: 'Status items' } },
        { name: 'firstVisitDays', type: 'number', required: true, defaultValue: 30, min: 1, label: { ar: 'صفحات أول زيارة', en: 'First-visit pages' } },
      ],
    },
    {
      // SEO day 19: the only prose on /inside/resorts ("أجمل مصايف سوريا"). Written by a person, never generated;
      // the page is noindex (and unlinked) until this is filled and enough trips are tagged "مصيف" (lib/resorts).
      name: 'resortsIntro',
      type: 'textarea',
      label: { ar: 'مقدمة صفحة "أجمل مصايف سوريا"', en: 'Intro of the "Syria\'s summer resorts" page' },
      admin: {
        description: {
          ar: 'فقرة قصيرة يكتبها إنسان (80 حرفاً على الأقل). الصفحة تعرض المشاوير اللي نوعها "مصيف". بلا أسعار ولا ادعاءات أمان. فارغة = الصفحة لا تُفهرس ولا تُربط.',
          en: 'A short paragraph written by a person (80+ characters). The page lists the trips tagged "مصيف". No prices or safety claims. Empty = the page is not indexed or linked.',
        },
      },
    },
  ],
}

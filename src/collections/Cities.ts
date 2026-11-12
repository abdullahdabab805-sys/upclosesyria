import type { CollectionConfig } from 'payload'
import { editorOrAdmin } from '@/access'

export const Cities: CollectionConfig = {
  slug: 'cities',
  labels: { singular: { ar: 'مدينة', en: 'City' }, plural: { ar: 'المدن', en: 'Cities' } },
  admin: { useAsTitle: 'name', defaultColumns: ['name', 'slug', 'tag'] },
  access: { read: () => true, create: editorOrAdmin, update: editorOrAdmin, delete: editorOrAdmin },
  fields: [
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      label: { ar: 'المعرّف في الرابط', en: 'Slug' },
      validate: (v: unknown) => (typeof v === 'string' && /^[a-z0-9-]+$/.test(v)) || 'حروف لاتينية صغيرة وأرقام وشرطات فقط',
    },
    { name: 'name', type: 'text', required: true, localized: true, label: { ar: 'الاسم', en: 'Name' } },
    { name: 'tag', type: 'text', localized: true, label: { ar: 'الوسم', en: 'Tag' } },
    { name: 'lede', type: 'textarea', localized: true, label: { ar: 'المقدمة', en: 'Lede' } },
    { name: 'eat', type: 'textarea', localized: true, label: { ar: 'ماذا تأكل', en: 'What to eat' } },
    {
      // SEO day 8: the only prose on /inside/near/<city>. Written by a person, never generated; the page is
      // noindex (and unlinked) until this is filled and the city has enough trips (lib/nearby).
      name: 'nearbyIntro',
      type: 'textarea',
      label: { ar: 'مقدمة صفحة "مشاوير قريبة من المدينة"', en: 'Intro of the "trips near the city" page' },
      admin: {
        description: {
          ar: 'فقرة قصيرة يكتبها إنسان (80 حرفاً على الأقل): لمين هالمشاوير، وكيف تختار بينها. بلا أسعار ولا ادعاءات أمان. فارغة = الصفحة لا تُفهرس ولا تُربط.',
          en: 'A short paragraph written by a person (80+ characters). No prices or safety claims. Empty = the page is not indexed or linked.',
        },
      },
    },
    { name: 'coverImage', type: 'upload', relationTo: 'media', label: { ar: 'صورة الغلاف', en: 'Cover image' } },
    { name: 'coverShotNote', type: 'text', localized: true, label: { ar: 'وصف لقطة الغلاف', en: 'Cover shot note' } },
    {
      // Resorts and towns (Bloudan, Palmyra…) belong to a main city's countryside: they leave the city
      // lists and the map, and their page moves to /inside/<trip slug> (owner decision 2026-10-26).
      name: 'parentCity',
      type: 'relationship',
      relationTo: 'cities',
      index: true,
      label: { ar: 'تابعة لريف مدينة', en: 'In the countryside of' },
      admin: { description: { ar: 'اتركها فارغة للمدن الرئيسية.', en: 'Leave empty for main cities.' } },
    },
    {
      // Questions people really search for (Search Console), added to the Arabic page's questions and its FAQ schema.
      // Written and answered by an editor from the page's sources: no prices, no safety claims (SEO day 12).
      name: 'askedQuestions',
      type: 'array',
      label: { ar: 'أسئلة يسألها الناس', en: 'Questions people ask' },
      labels: { singular: { ar: 'سؤال', en: 'Question' }, plural: { ar: 'أسئلة', en: 'Questions' } },
      admin: { description: { ar: 'بالعربي، تظهر في الصفحة العربية فقط. سؤال حقيقي من بحث الناس (مثل: وين تقع حلب؟) وجوابه القصير من مصادر الصفحة. بلا أسعار ولا ادعاءات أمان.', en: 'Arabic, shown on the Arabic page only. A real search question and its short answer from the page sources. No prices, no safety claims.' } },
      fields: [
        { name: 'question', type: 'text', required: true, label: { ar: 'السؤال', en: 'Question' } },
        { name: 'answer', type: 'textarea', required: true, label: { ar: 'الجواب', en: 'Answer' } },
      ],
    },
  ],
}

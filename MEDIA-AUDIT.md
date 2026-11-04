# MEDIA-AUDIT — الصور والفيديو

> `npm run media:audit -- http://localhost:3100` · 2026-11-03 · 11 صفحات · هاتف 412×823 بكثافة 1.75

## الخلاصة

- صور في HTML الأولي: **172** (منها 21 زخرفية `alt=""`)
- بلا alt: **0** · alt ضعيف (اسم ملف، عام، طويل): **0** · بغير لغة الصفحة: **0**
- alt مكرّر لصور مختلفة في الصفحة نفسها: **5**
- بلا أبعاد (تسبب CLS): **0** · صورة LCP بـ lazy: **0**
- صور تُنزَّل بأكبر من 1.5× ما تحتاجه الشاشة: **11**
- أسماء ملفات غير وصفية: **19**
- iframe فيديو في HTML الأولي: **0** · VideoObject ناقص: **0**
- صور خارجية لم تُفحص من هذه البيئة: 75

## لكل صفحة

| الصفحة | صور | بلا alt / ضعيف / لغة | عنصر LCP (هاتف) | مشكلات التحميل | OG | صور JSON-LD | صور الـ sitemap | iframe | JS (KB) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `/` | 10 | 0 / 0 / 0 | h1 · 1260ms | — | ✅ | — | — | 0 | 162 |
| `/en` | 10 | 0 / 0 / 0 | h1 · 508ms | — | ✅ | — | — | 0 | 162 |
| `/cities/damascus` | 45 | 0 / 0 / 0 | img `/guide/u-damascus-new-0.webp` · 376ms | — | ✅ | — | 23/31 | 0 | 206 |
| `/en/cities/damascus` | 43 | 0 / 0 / 0 | img `/guide/u-damascus-new-0.webp` · 304ms | — | ✅ | — | 23/31 | 0 | 205 |
| `/cities/aleppo` | 41 | 0 / 0 / 0 | img `/guide/gallery-aleppo-0.webp` · 476ms | — | ✅ | — | 6/8 | 0 | 203 |
| `/inside/bloudan` | 11 | 0 / 0 / 0 | img `/guide/gallery-bloudan-0.webp` · 292ms | — | ✅ | — | 4/4 | 0 | 201 |
| `/seasons/damascus-2026-12-01` | 1 | 0 / 0 / 0 | p · 216ms | — | ✅ | — | — | 0 | 158 |
| `/blog/damascus-from-qasioun` | 6 | 0 / 0 / 0 | img `/guide/u-damascus-8.webp` · 284ms | — | ✅ | — | 5/5 | 0 | 147 |
| `/guides/e2e-guide-1793609190494-fr` | 1 | 0 / 0 / 0 | h1 · 208ms | — | ✅ | — | — | 0 | 160 |
| `/videos` | 2 | 0 / 0 / 0 | p · 172ms | — | ✅ | — | — | 0 | 149 |
| `/en/videos` | 2 | 0 / 0 / 0 | p · 196ms | — | ✅ | — | — | 0 | 149 |

## الصور الأثقل من حاجتها

| الصفحة | الصورة | عرضها الأصلي | تُرسم بعرض (CSS px) | الحجم |
| --- | --- | --- | --- | --- |
| `/` | `/brand/ahleen-green.svg` | 1077 | 96 | 12 KB |
| `/en` | `/brand/ahleen-green.svg` | 1077 | 96 | 12 KB |
| `/cities/damascus` | `/brand/ahleen-green.svg` | 1077 | 96 | 12 KB |
| `/en/cities/damascus` | `/brand/ahleen-green.svg` | 1077 | 96 | 12 KB |
| `/cities/aleppo` | `/brand/ahleen-green.svg` | 1077 | 96 | 12 KB |
| `/inside/bloudan` | `/brand/ahleen-green.svg` | 1077 | 96 | 12 KB |
| `/seasons/damascus-2026-12-01` | `/brand/ahleen-green.svg` | 1077 | 96 | 12 KB |
| `/blog/damascus-from-qasioun` | `/brand/ahleen-green.svg` | 1077 | 96 | 12 KB |
| `/guides/e2e-guide-1793609190494-fr` | `/brand/ahleen-green.svg` | 1077 | 96 | 12 KB |
| `/videos` | `/brand/ahleen-green.svg` | 1077 | 96 | 12 KB |
| `/en/videos` | `/brand/ahleen-green.svg` | 1077 | 96 | 12 KB |

## alt ضعيف أو بغير لغة الصفحة

| الصفحة | الصورة | alt الحالي | المشكلة |
| --- | --- | --- | --- |

## alt مكرّر في الصفحة نفسها

- `/cities/damascus`: «صورة من دمشق»
- `/en/cities/damascus`: «A photo of Damascus»
- `/cities/aleppo`: «قلعة حلب»، «صورة من حلب»
- `/inside/bloudan`: «صورة من بلودان»

## الفيديو

- `/videos`: iframe قبل التشغيل 0، JavaScript 149KB، VideoObject ناقص: لا شيء
- `/en/videos`: iframe قبل التشغيل 0، JavaScript 149KB، VideoObject ناقص: لا شيء

## صور الـ sitemap غير الظاهرة في الصفحة

- `/cities/damascus`: /8aa3b9c8-78c5-4df8-96be-fcfb02b890ba.webp، /76d7dc57-82f9-4c2d-a2c1-3b1909c466ab.webp، /338d8a6b-da08-4bb2-8f31-8e0668f95050.webp، /1c725628-874a-4607-af70-23219735b643.webp، /guide/u-damascus-0.webp، /guide/u-damascus-4.webp، /guide/u-damascus-6.webp
- `/en/cities/damascus`: /8aa3b9c8-78c5-4df8-96be-fcfb02b890ba.webp، /76d7dc57-82f9-4c2d-a2c1-3b1909c466ab.webp، /338d8a6b-da08-4bb2-8f31-8e0668f95050.webp، /1c725628-874a-4607-af70-23219735b643.webp، /guide/u-damascus-0.webp، /guide/u-damascus-4.webp، /guide/u-damascus-6.webp

# الفحص الأسبوعي والتقرير الخاص (SEO اليوم 7)

## ما يعمل تلقائياً

| ماذا | أين | متى | ماذا يرى العامة |
| --- | --- | --- | --- |
| فحص seo + geo + media + Lighthouse للموقع المنشور | GitHub Actions: `weekly-audit` | كل أحد 06:00 بتوقيت الرياض، ويدوياً | نعم: issue واحد عند التراجع، وملخص التشغيل. بيانات عامة فقط |
| نفس الفحص (بلا Lighthouse) على البناء المعزول | GitHub Actions: `audit-pr` | كل Pull Request على `main` | نعم: ملخص التشغيل |
| تقرير Search Console وBing والمعلومات القديمة | Vercel Cron: `/api/seo-report` | كل أحد بين 06:00 و06:59 بتوقيت الرياض | لا. يصل بالبريد إلى `SEO_REPORT_TO` فقط |

التقرير الخاص لا يمر بـ GitHub أبداً: المستودع عام، وسجلات Actions وملفاته يراها أي أحد. أسرار Google وBing في Vercel فقط، والـ endpoint يُرجع أعداداً لا بيانات.

## ما عليك فعله مرة واحدة

### 1. البريد (يكفي وحده لقائمة المعلومات القديمة)
1. Vercel ‹ Project ‹ Settings ‹ Environment Variables ‹ Production.
2. أضف `SEO_REPORT_TO` = بريدك (أكثر من بريد مفصولة بفواصل).
3. `CRON_SECRET` و`RESEND_API_KEY` موجودان من الدفعة 4؛ لا تغيّرهما.
4. أعد النشر (Redeploy) ليُقرأ المتغير.

### 2. Search Console (حساب خدمة، قراءة فقط)
1. [Google Cloud Console](https://console.cloud.google.com/) ‹ مشروع جديد (أو موجود) ‹ APIs & Services ‹ Library ‹ فعّل **Google Search Console API**.
2. IAM & Admin ‹ Service Accounts ‹ Create. لا تعطه أي دور في المشروع.
3. افتح الحساب ‹ Keys ‹ Add key ‹ JSON. ينزل ملف؛ احفظه في مدير كلمات المرور.
4. [Search Console](https://search.google.com/search-console) ‹ خاصية `upclosesyria.com` ‹ Settings ‹ Users and permissions ‹ Add user ‹ بريد حساب الخدمة (`...@...iam.gserviceaccount.com`) بصلاحية **Restricted**.
5. Vercel ‹ Production: `GSC_SERVICE_ACCOUNT_JSON` = محتوى ملف JSON كاملاً (أو نسخته بـ base64). `GSC_SITE_URL` يبقى `sc-domain:upclosesyria.com` لأن الخاصية من نوع Domain.
6. لا تضع الملف في المستودع ولا في GitHub Secrets. احذفه من جهازك بعد حفظه.

### 3. Bing Webmaster
1. [Bing Webmaster Tools](https://www.bing.com/webmasters) ‹ Settings (الترس) ‹ API access ‹ API key ‹ Generate.
2. Vercel ‹ Production: `BING_WEBMASTER_API_KEY` = المفتاح.

### 4. (اختياري) مفتاح PageSpeed Insights
بدونه يسأل الفحص الأسبوعي عن بيانات CrUX بحصة Google المجانية بلا مفتاح، وقد تُرفض أحياناً. لإضافته: Google Cloud ‹ Credentials ‹ API key مقيّد بـ PageSpeed Insights API، ثم GitHub ‹ Settings ‹ Secrets ‹ Actions: `PSI_API_KEY`. هذا المفتاح لا يكشف بيانات خاصة.

## خط الأساس

- الملفات في `audits/baseline/` (واحد لكل هدف). تُحدَّث يدوياً فقط.
- أول تشغيل بلا خط أساس يكتب `*.candidate.json` في artifact التشغيل ولا يفشل.
- لاعتماد قياس جديد: Actions ‹ weekly-audit ‹ Run workflow ‹ ✔ update_baseline، ثم نزّل الـ artifact وأضف الملف في commit بعد مراجعته.

## الحصص والاستهلاك

| المورد | الاستهلاك الأسبوعي | الحد المجاني |
| --- | --- | --- |
| GitHub Actions | تشغيل أسبوعي (~20–30 دقيقة) + تشغيل لكل PR | غير محدود للمستودعات العامة على المشغّلات القياسية |
| Vercel Functions | استدعاء cron واحد، وطلبات الفحص لنحو 11 صفحة وصورها | ضئيل مقارنة بحدود Hobby |
| Vercel Cron | مهمة ثالثة أسبوعية | Hobby: حتى 100 مهمة، مرة يومياً كحد أقصى، بدقة ساعة |
| Search Console API | 3 استعلامات تحليل + 7 فحوص URL | أقل بكثير من حصص Google المنشورة |
| Bing Webmaster API | استدعاء واحد | — |
| Resend | رسالة واحدة | تُحسب ضمن حصة الخطة الحالية |

## مراجع
- [Vercel: Cron Jobs usage and pricing](https://vercel.com/docs/cron-jobs/usage-and-pricing)
- [Search Console API: searchAnalytics.query](https://developers.google.com/webmaster-tools/v1/searchanalytics/query)
- [URL Inspection API](https://developers.google.com/search/blog/2022/01/url-inspection-api)
- [Google: service accounts (JWT)](https://developers.google.com/identity/protocols/oauth2/service-account#httprestapi)
- [Bing Webmaster API: GetQueryStats](https://learn.microsoft.com/en-us/dotnet/api/microsoft.bing.webmaster.api.interfaces.iwebmasterapi.getquerystats)
- [GitHub: scheduled workflows are disabled after 60 days of inactivity in public repositories](https://docs.github.com/en/actions/managing-workflow-runs-and-deployments/managing-workflow-runs/disabling-and-enabling-a-workflow)

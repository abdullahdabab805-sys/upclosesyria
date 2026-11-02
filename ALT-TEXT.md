# ALT-TEXT — مقترحات وصف الصور (اليوم السادس، الدفعة الأولى)

> 2026-11-02 · كُتبت بعد النظر إلى كل صورة. **اعتمدها صاحب الموقع في 2026-11-02 مع أسماء المعالم**، وهي مطبّقة في `src/content/photos.json` (حقل `alt: { ar, en }`، يقرؤه `photoAlt`).
> صور الأكل المعلّمة ⚠️ بقيت بوصف الطبق فقط إلى أن تُستبدل بصور من سوريا. الصور المكرّرة حُذفت من معرض دمشق (بقيت في الملف لأن صفحات أخرى قد تستخدمها).
> رجوع عنها = حذف الحقل. صور Payload (المراسلون) وصفها إلزامي أصلاً ولا تدخل هنا.

## القواعد المتبعة

- يصف ما يظهر في الصورة فقط. لا "أجمل" ولا "أشهر" ولا تقييم.
- اسم المدينة مسموح: الصورة مربوطة بمدينتها في دليل المدينة (`src/content/guide.ts`).
- **أسماء المعالم** (الجامع الأموي، قلعة حلب…) ليست مربوطة بالصورة في قاعدة البيانات، فالمقترح يصفها دون اسم. عمود "اسم مقترح" فيه الاسم الذي أظنه، **ولا يُستخدم إلا إذا أكّدته**.
- حتى 125 حرفاً تقريباً، عربي للصفحات العربية وإنجليزي للإنجليزية.

## ما الذي يحصل الآن (للمقارنة)

- صور المعرض في صفحة المدينة: كل صورة وصفها "صورة من دمشق" (37 صورة بالوصف نفسه).
- صور الغلاف الاحتياطية (حين لا توجد صورة مراسل): تأخذ **اسم مكان أو ملاحظة التصوير** وليس ما في الصورة. مثال: صورة دمشق من فوق مع الجامع الأموي وصفها الآن «ضوء على بلاط باب توما بعد المطر»، وصورتان مختلفتان في الصفحة نفسها وصفهما «سوق الحميدية». هذا وصف غير صحيح، ويُصلح بهذه المقترحات.

## دمشق — مجموعة `u-damascus-new`

| المفتاح | المقترح (عربي) | Proposed (English) | اسم مقترح (يحتاج تأكيدك) |
| --- | --- | --- | --- |
| u-damascus-new-0 | دمشق القديمة من فوق: جامع بقبة رصاصية ومآذن حجرية بين أسطح البيوت | Old Damascus from above: a mosque with a lead dome and stone minarets among the rooftops | الجامع الأموي |
| u-damascus-new-1 | قنطرة حجرية معتمة تنفتح على قبة ذهبية في آخر السوق | A dark stone arch opening onto a golden dome at the end of the market | سوق الحميدية وقبة الخزنة |
| u-damascus-new-2 | مدخل جامع بأعمدة رخامية وزجاج ملوّن، ومصلّون يعبرون الصحن | A mosque entrance with marble columns and stained glass, worshippers crossing the courtyard | الجامع الأموي |
| u-damascus-new-3 | واجهة جامع بفسيفساء ذهبية تحت قبة رصاصية | A mosque façade with gold mosaics under a lead dome | الجامع الأموي |
| u-damascus-new-4 | قاعة بيت دمشقي بجدران زرقاء مزخرفة وأرائك حمراء | A Damascene house hall with ornate blue walls and red sofas | — |
| u-damascus-new-5 | باب خشبي داخل قوس رخامي منحوت بزخارف نباتية | A wooden door framed by a marble arch carved with leaves | — |
| u-damascus-new-6 | قوس حجري مزخرف وشبّاك حديد، وأغصان نارنج فوقه | A carved stone arch and iron window, with bitter-orange branches above | — |
| u-damascus-new-7 | زخارف حجرية ملوّنة على جدار بيت دمشقي | Coloured carved stone patterns on a Damascene house wall | — |
| u-damascus-new-8 | ثلاثة شبابيك حديد مشغول تحت إفريز حجري منحوت | Three wrought-iron windows under a carved stone frieze | — |
| u-damascus-new-9 | إيوان بيت دمشقي بقوس أبلق ونجفة، وأغصان ليمون في المقدمة | A Damascene house iwan with a striped arch and chandelier, lemon branches in front | — |
| u-damascus-new-10 | ثمار كبّاد صفراء على غصنها | Yellow citron fruit on the branch | — |
| u-damascus-new-11 | ساحة دوّار بنافورة ونصب ملوّن، وشارع تحفّه النخيل | A roundabout with a fountain and a colourful monument, a palm-lined street beyond | ساحة الأمويين |
| u-damascus-new-12 | علم سوري كبير فوق حديقة ودوّار أخضر | A large Syrian flag over a park and a green roundabout | — |
| u-damascus-new-13 | أحياء دمشق المزدحمة بالأبنية من الأعلى | Dense Damascus neighbourhoods seen from above | — |
| u-damascus-new-14 | دمشق ليلاً من الجبل: ساحة مضيئة بين البيوت | Damascus at night from the mountain: a lit square among the houses | — |
| u-damascus-new-15 | صورة جوية لشوارع تتفرع من دوّار كالنجمة | Aerial view of streets branching from a star-shaped roundabout | — |
| u-damascus-new-16 | صورة جوية لتقاطع شوارع وأبنية دمشق | Aerial view of Damascus streets and blocks | — |
| u-damascus-new-17 | **مكرّرة**: الملف نفسه بالضبط مثل u-damascus-new-13 (البصمة نفسها). اقتراح: حذفها من المعرض | — | — |
| u-damascus-new-18 | علم سوري فوق حديقة، ودوّار تمر حوله السيارات | A Syrian flag above a park, cars circling a roundabout | — |
| u-damascus-new-19 | دمشق في ضباب العصر، وبرج أبيض بين الأبنية | Damascus in afternoon haze, a white tower among the buildings | — |
| u-damascus-new-20 | امتداد دمشق تحت سماء مغبرّة | Damascus spreading under a dusty sky | — |

## دمشق — مجموعة `u-damascus` (أغلبها نسخ من المجموعة السابقة)

8 صور هنا تكاد تطابق صوراً في `u-damascus-new` (قص أو لون مختلف قليلاً)، وكلها في معرض دمشق نفسه، فيرى الزائر الصورة مرتين: u-damascus-1≈new-3، ‏2≈new-1، ‏3≈new-2، ‏5≈new-11، ‏7≈new-6، ‏8≈new-19، ‏10≈new-15، ‏11≈new-16، ‏13≈new-14. **اقتراح:** إبقاء نسخة واحدة من كل صورة (قرارك). المقترحات للصور غير المكرّرة:

| المفتاح | المقترح (عربي) | Proposed (English) | اسم مقترح |
| --- | --- | --- | --- |
| u-damascus-0 | قبة رصاصية وهلال نحاسي من خلال نافذة حجرية ضيقة | A lead dome and brass crescent seen through a narrow stone window | الجامع الأموي |
| u-damascus-4 | دمشق والجبل من خلال فتحة حجرية | Damascus and the mountain through a stone opening | جبل قاسيون |
| u-damascus-6 | فناء بيت دمشقي ببحرة ونباتات وعرائش زهر | A Damascene courtyard with a fountain, plants and flowering vines | — |
| u-damascus-9 | أبنية دمشق تمتد حتى الأفق في يوم ضبابي | Damascus buildings stretching to the horizon on a hazy day | — |
| u-damascus-12 | ثلج على فانوس شارع ونخيل ودوّار في دمشق | Snow on a street lamp, palms and a roundabout in Damascus | — |
| u-damascus-14 | واجهة بيت قديم بأبواب خشبية خضراء وحجر ملوّن | An old house front with green wooden doors and coloured stone | — |
| u-damascus-15 | علم سوري فوق حديقة خضراء ودوّار | A Syrian flag over a green park and a roundabout | — |

## حلب

| المفتاح | المقترح (عربي) | Proposed (English) | اسم مقترح |
| --- | --- | --- | --- |
| gallery-aleppo-0 | مسجد حجري بقبة صغيرة ومئذنة مربعة على تلة | A stone mosque with a small dome and a square minaret on a hill | الجامع الكبير داخل قلعة حلب (اسم ملف Commons) |
| gallery-aleppo-1 | بوابة حجرية ضخمة بأبراج يصلها جسر بأقواس | A massive stone gateway with towers, reached by an arched bridge | مدخل قلعة حلب |
| gallery-aleppo-2 | جامع بقباب خضراء ومئذنتين أمام أبنية حلب | A mosque with green domes and two minarets before Aleppo's buildings | — |
| gallery-aleppo-3 | منظر عريض لأطلال حجرية فوق التلة | A wide view of stone ruins on the hilltop | داخل قلعة حلب |
| gallery-aleppo-4 | أطلال وقبة حجرية بين العشب فوق حلب | Stone ruins and a dome among grass above Aleppo | داخل قلعة حلب |
| gallery-aleppo-5 | قلعة على تلة وساحة واسعة أمامها | A citadel on a hill with a wide square before it | قلعة حلب |

## بلودان

| المفتاح | المقترح (عربي) | Proposed (English) | ملاحظة |
| --- | --- | --- | --- |
| gallery-bloudan-0 | سرو وأشجار على منحدر بلودان تحت غيوم بيضاء | Cypresses and trees on a Bloudan slope under white clouds | — |
| gallery-bloudan-1 | بلودان وبيوتها بالأسطح الحمراء تحت الجبل | Bloudan's red-roofed houses below the mountain | — |
| gallery-bloudan-2 | غيوم فوق تلة مشجّرة في بلودان | Clouds over a wooded hill in Bloudan | — |
| gallery2-bloudan-3 | ثلج على بساتين بلودان وغيوم منخفضة | Snow on Bloudan's orchards under low cloud | — |
| food-bloudan-0 | شجرة عارية وأبنية بلودان تحت سماء زرقاء | A bare tree and Bloudan buildings under a blue sky | ليست صورة أكل رغم اسمها، وغير مستخدمة في الدليل حالياً |

## بيوت دمشق (`u-house`، في الرئيسية والمقالات)

نسخ من صور `u-damascus-new`، فالمقترح نفسه: u-house-0=new-4، ‏1=new-9، ‏3=new-8، ‏4=new-7، ‏5=new-5، ‏6=new-10.

| المفتاح | المقترح (عربي) | Proposed (English) |
| --- | --- | --- |
| u-house-2 | رواق بأعمدة رخامية وأقواس أمام باب خشبي | A colonnade of marble columns and arches before a wooden door |

## صور الأكل: تحتاج قرارك قبل الوصف

الوصف المقترح يصف الطبق فقط، لأن مصادر بعض هذه الصور (حسب صفحاتها على Commons) **ليست من سوريا**، وهي تظهر تحت أكل مدينة سورية:

| المفتاح | المصدر (من `credit`/`href`) | المقترح (عربي) | Proposed (English) | ملاحظة |
| --- | --- | --- | --- | --- |
| food-bloudan-2 | "Lamb Shish Kebab – Istanbul Grill, **Metairie, Louisiana**" | صحن شيش لحم مع رز وسلطة وخبز | A plate of lamb kebab with rice, salad and bread | ⚠️ مطعم في أمريكا، وهي صورة بطاقة «مشاوي الجبل» في بلودان |
| food-damascus-3 | "Local bakery bread" (لافتات بالفرنسية: PAIN CÉRÉALES) | خبز بالسمسم على رفوف مخبز | Sesame bread loaves on bakery shelves | ⚠️ يبدو خارج سوريا |
| food-damascus-4 | El Mono Español, "حمص باللحم" | صحن حمص باللحم المفروم وزيت الزيتون | A plate of hummus topped with minced meat and olive oil | ⚠️ مكان التصوير غير معروف |
| food-aleppo-3 | "Baklava utensils for **Emine Şerife Hanım**" | صواني نحاس مكدّسة على حامل | Stacked brass trays on a stand | ⚠️ يبدو من تركيا |
| food-aleppo-1 | "Kibbeh Bil Sanieh" | صينية كبة مقطّعة معيّنات | A tray of baked kibbeh cut into diamonds | مكان التصوير غير معروف |
| food-damascus-1 | Sheam k، "مقهى النوفرة" | مقهى بعريشة نبات وطاولات في دمشق القديمة | A café under a vine trellis with tables in Old Damascus | اسم مقترح: مقهى النوفرة (من اللافتة في الصورة) |
| food-damascus-2 | Abdallah Khader، "الكنافة الفلسطينية" | بائع بطربوش أحمر يحضّر صواني كنافة | A vendor in a red fez preparing trays of knafeh | الملف اسمه "الكنافة الفلسطينية": هل التصوير في دمشق؟ |

هوية الموقع "صور قريبة وواقعية من سوريا". **اقتراح:** استبدال الصور الأربع المعلّمة ⚠️ بصور من سوريا (من @syrvisual أو مراسلين)، أو إبقاؤها مع وصف الطبق فقط كما فوق. القرار لك.

## الدفعات التالية

- **نحو 140 صورة محلية أخرى** (الألوان، حوران، المدن الأخرى، الحدائق) بالطريقة نفسها بعد اعتمادك لأسلوب هذه الدفعة.
- **52 صورة @syrvisual على Vercel Blob** و**657 صورة من Commons/Flickr**: لم أستطع فتحها من بيئة العمل هذه (الشبكة محجوبة). صور Commons أسماء ملفاتها وصفية، ويمكن بدء وصفها منها ثم مراجعتها بالنظر.

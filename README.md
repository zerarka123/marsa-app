# مرسى — السوق البحري الجزائري

مشروع واحد يضم: **تطبيق أندرويد** (جاهز لـ Google Play) + **موقع المحفظة** (شحن الرصيد ببريدي موب / CIB) + **لوحة إدارة** + **صفحات السياسة** — كلها على قاعدة Supabase واحدة.

| المجلد | ما هو |
|---|---|
| `src/` | كود التطبيق (React). الإعدادات كلها في `src/config.ts` |
| `web/` | موقع المحفظة (`index.html`) ولوحة الإدارة (`admin.html`) |
| `public/` | سياسة الخصوصية، الشروط، حذف الحساب (تُنشر على الإنترنت وتُعرض داخل التطبيق) |
| `supabase/` | `setup.sql` (قاعدة البيانات) + دالتا بوابة SATIM |
| `store/` | نصوص ومواد صفحة المتجر + `README-AR.md` (دليل النشر) |
| `.github/workflows/` | البناء والتوقيع والنشر التلقائي |

---

## الخطوات (مرة واحدة فقط)

### 1) قاعدة البيانات
1. Supabase ← **SQL Editor** ← New query ← الصق كامل `supabase/setup.sql` ← **Run**.
2. Supabase ← **Authentication ← URL Configuration**: ضع في *Site URL* رابط موقعك (الخطوة 3) متبوعاً بـ `/confirmed.html`.
3. (موصى به) Authentication ← Providers ← Email: اترك **Confirm email** مفعّلاً، وفعّل **CAPTCHA** من Authentication ← Attack Protection.

### 2) المفاتيح
افتح `src/config.ts` وضع:
- `BACKEND.url` و `BACKEND.anonKey` (من Supabase ← Project Settings ← API — المفتاح **العام** فقط، ممنوع service_role).
- `SITE_URL` = رابط موقعك على GitHub Pages، مثال `https://USER.github.io/REPO` (بدون / في النهاية).

### 3) GitHub
1. ارفع **محتويات** هذا المجلد (وليس المجلد نفسه) إلى مستودع GitHub، فرع `main`. (يجب أن يكون المستودع **عاماً** كي تعمل GitHub Pages مجاناً.)
2. Settings ← **Pages** ← Source: **GitHub Actions**.
3. تبويب Actions ← سيعمل `Deploy website` تلقائياً. بعد نجاحه يصبح لديك:
   - `SITE_URL/` ← موقع المحفظة
   - `SITE_URL/privacy.html` ← **رابط سياسة الخصوصية لـ Google Play**
   - `SITE_URL/delete-account.html` ← **رابط حذف الحساب لـ Google Play**
   - `SITE_URL/admin.html` ← لوحة الإدارة

### 4) حسابك كمشرف
افتح الموقع وأنشئ حسابك بالبريد `marsadz544@gmail.com`، أكّده من الرسالة، ثم شغّل `supabase/make-admin.sql` في SQL Editor. بعدها افتح `admin.html` ← **إعدادات الدفع** وأدخل رقم RIP/CCP الذي تستقبل عليه الأموال.

### 5) مفتاح التوقيع (مرة واحدة — مهم جداً)
Actions ← **Create upload keystore** ← Run workflow ← حمّل الـ Artifact `marsa-upload-keystore` ← أضف الأسرار الأربعة المكتوبة في `SECRETS-README.txt` (Settings ← Secrets and variables ← Actions). **احتفظ بنسخة من ملف `.jks` وكلمة المرور** ثم احذف الـ Artifact.

### 6) بناء التطبيق
Actions ← **Build Android** ← Run workflow. من Artifacts حمّل `marsa-android`:
- `marsa-release.aab` ← **هذا ما ترفعه إلى Google Play**
- `marsa-release.apk` ← نسخة موقّعة للتوزيع المباشر
- `marsa-debug-TEST-ONLY.apk` ← للتجربة على هاتفك فقط

رقم الإصدار (`versionCode`) يزيد تلقائياً مع كل بناء.

### 7) النشر على Google Play
اتبع `store/README-AR.md` (نصوص جاهزة، إجابات نموذج Data Safety، قائمة التحقق).

---

## شحن الرصيد (موقع المحفظة)
- **بريدي موب / CCP:** يعمل فوراً بعد إدخال رقم RIP/CCP في لوحة الإدارة. الزبون يحوّل ويرفع الوصل، وأنت تضغط «قبول» فيُضاف الرصيد.
- **بطاقة CIB / الذهبية (SATIM):** تحتاج عقد تاجر مع SATIM (بنكك). بعدها:
  1. Supabase ← Edge Functions ← انشر `satim-register` و `satim-return` (الصق كود المجلدين في `supabase/functions/`). عطّل *Verify JWT* لـ `satim-return` فقط.
  2. Edge Functions ← Secrets: `SATIM_URL`, `SATIM_USER`, `SATIM_PASSWORD`, `SATIM_TERMINAL`, `SITE_URL`.
  3. اختبر في بيئة SATIM التجريبية ثم فعّل «الدفع بالبطاقة» من لوحة الإدارة.
  > الدالتان كُتبتا حسب واجهة SATIM المعروفة (register.do / confirmOrder.do) ولم تُختبرا مع بوابة حقيقية؛ طابق أسماء الحقول مع وثائق SATIM التي تُسلَّم لك.

## الأمان — ما تم تنفيذه
CSP صارمة، تعطيل النسخ الاحتياطي وcleartext وتصحيح وضع التصحيح، RLS على كل الجداول، الرصيد للقراءة فقط من التطبيق (الكتابة عبر دوال خادم محمية)، منع العد المزدوج للدفع، حدود يومية ضد الإغراق، التحقق من الهاتف والصور والمدخلات، إخفاء روابط الصور الخارجية، حذف الحساب وبياناته.

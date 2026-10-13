// ─────────────────────────────────────────────────────────────
//  إعدادات مرسى — كل ما تحتاج تغييره موجود في هذا الملف فقط
// ─────────────────────────────────────────────────────────────

export const APP = {
  name: 'مرسى',
  version: '1.0.0',
};

// بريد التواصل والبلاغات (يظهر في التطبيق وفي صفحات السياسة)
export const CONTACT = {
  email: 'marsadz544@gmail.com',
};

// ───────── الخادم (Supabase) ─────────
// خذهما من: Supabase ← Project Settings ← API
//   url     : مثال  https://abcdefgh.supabase.co
//   anonKey : المفتاح العام (anon / publishable) — مفتاح عام بطبيعته، لا مشكلة في وضعه هنا.
// ⚠️ لا تضع هنا أبداً مفتاح service_role السري.
export const BACKEND = {
  url: 'https://agnorgnhgtiviedhrrcd.supabase.co',
  anonKey: 'sb_publishable_YDOpfwvgvTsqqsrH1_o-Mw_W5FanyBU',
};

// ───────── الموقع (سياسة الخصوصية على الإنترنت) ─────────
// رابط موقع GitHub Pages بدون "/" في النهاية. مثال: https://zerarka123.github.io/marsa
export const SITE_URL = 'https://zerarka123.github.io/marsa-app';

// رابط التطبيق في متجر Google Play (يُملأ بعد النشر، ويستعمل في زر المشاركة)
export const PLAY_URL = '';

// ───────── الرصيد ─────────
// الرصيد في التطبيق للعرض فقط (يُقرأ من قاعدة البيانات). الشحن يتم عبر الموقع الإلكتروني فقط.
// ضع false لإخفاء رسالة الشحن بالكامل (مثلاً إن طلبت Google Play ذلك عند المراجعة).
export const SHOW_TOPUP_NOTICE = true;

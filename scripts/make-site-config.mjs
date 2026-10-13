// يولّد site/config.js من src/config.ts حتى يكون هناك مصدر واحد لمفاتيح Supabase.
import { readFileSync, writeFileSync } from 'node:fs';

const src = readFileSync('src/config.ts', 'utf8');
const block = src.match(/export const BACKEND = \{([\s\S]*?)\};/);
if (!block) { console.error('❌ لم أجد BACKEND في src/config.ts'); process.exit(1); }
const pick = (re, text) => (text.match(re) || [, ''])[1].trim();
const url = pick(/url:\s*'([^']*)'/, block[1]).replace(/\/+$/, '');
const anonKey = pick(/anonKey:\s*'([^']*)'/, block[1]);
const siteUrl = pick(/export const SITE_URL = '([^']*)'/, src).replace(/\/+$/, '');

if (!/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(url) || anonKey.length < 20) {
  // لا نفشل: تُنشر صفحات السياسة على الأقل، لكن المحفظة تبقى معطّلة حتى تُضبط المفاتيح.
  console.warn('⚠️ مفاتيح Supabase غير مضبوطة في src/config.ts — ستُنشر صفحات السياسة فقط، والمحفظة معطّلة.');
  writeFileSync('site/config.js', `window.MARSA = ${JSON.stringify({ url: '', anonKey: '', siteUrl })};\n`);
  process.exit(0);
}
if (/service_role/i.test(anonKey) || (anonKey.startsWith('eyJ') && JSON.parse(Buffer.from(anonKey.split('.')[1], 'base64url').toString()).role === 'service_role')) {
  console.error('❌ هذا مفتاح service_role السري! استعمل المفتاح العام (anon/publishable) فقط.');
  process.exit(1);
}
writeFileSync('site/config.js', `window.MARSA = ${JSON.stringify({ url, anonKey, siteUrl })};\n`);
console.log('✅ site/config.js جاهز');

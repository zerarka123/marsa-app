// يُشغَّل في GitHub Actions بعد `cap add android` لتجهيز المشروع لمتجر Google Play.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const fail = (msg) => { console.error('❌ ' + msg); process.exit(1); };
const versionCode = Number(process.env.VERSION_CODE || '1');
const versionName = process.env.VERSION_NAME || '1.0.0';
if (!Number.isInteger(versionCode) || versionCode < 1) fail('VERSION_CODE غير صالح');

// 1) رقم الإصدار (يزيد تلقائياً مع كل بناء — شرط لرفع تحديثات Google Play)
const gradlePath = 'android/app/build.gradle';
if (!existsSync(gradlePath)) fail(gradlePath + ' غير موجود');
let g = readFileSync(gradlePath, 'utf8');
if (!/versionCode\s*=?\s*\d+/.test(g)) fail('لم أجد versionCode في build.gradle');
if (!/versionName\s*=?\s*"[^"]*"/.test(g)) fail('لم أجد versionName في build.gradle');
g = g.replace(/versionCode\s*=?\s*\d+/, `versionCode ${versionCode}`)
     .replace(/versionName\s*=?\s*"[^"]*"/, `versionName "${versionName}"`);
writeFileSync(gradlePath, g);

// 2) تحصين AndroidManifest
const manPath = 'android/app/src/main/AndroidManifest.xml';
if (!existsSync(manPath)) fail(manPath + ' غير موجود');
let m = readFileSync(manPath, 'utf8');
const m0 = m.match(/<application\b[^>]*>/);
if (!m0) fail('لم أجد وسم <application>');
let tag = m0[0];
const setAttr = (t, name, value) => {
  const re = new RegExp(`\\s${name.replace(':', '\\:')}="[^"]*"`);
  return re.test(t) ? t.replace(re, ` ${name}="${value}"`) : t.replace('<application', `<application ${name}="${value}"`);
};
tag = setAttr(tag, 'android:allowBackup', 'false');
tag = setAttr(tag, 'android:usesCleartextTraffic', 'false');
tag = setAttr(tag, 'android:supportsRtl', 'true');
m = m.replace(m0[0], tag);
writeFileSync(manPath, m);

console.log(`✅ تم تجهيز مشروع أندرويد: versionCode=${versionCode} versionName=${versionName}`);

// عميل Supabase خفيف + أدوات مشتركة لموقع مرسى (محفظة + إدارة)
const C = window.MARSA || { url: '', anonKey: '', siteUrl: '' };
export const backendReady = () => Boolean(C.url && C.anonKey);
const SKEY = 'marsa-web-session';

export const esc = (v) =>
  String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const money = (n) => new Intl.NumberFormat('fr-DZ').format(Number(n) || 0).replace(/[\u202f\u00a0]/g, ' ') + ' دج';
export const when = (iso) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : new Intl.DateTimeFormat('ar-DZ-u-nu-latn', { dateStyle: 'medium', timeStyle: 'short' }).format(d);
};

export class ApiError extends Error {
  constructor(message, code = '', status = 0) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

const MSG = {
  network: 'تعذّر الاتصال بالخادم. تحقق من الإنترنت وحاول مجدداً.',
  invalid_credentials: 'البريد الإلكتروني أو كلمة المرور غير صحيحة.',
  email_not_confirmed: 'لم يتم تأكيد بريدك بعد. افتح رسالة التأكيد ثم سجّل الدخول.',
  weak_password: 'كلمة المرور ضعيفة (8 أحرف على الأقل مع حروف وأرقام).',
  user_already_exists: 'هذا البريد مسجّل من قبل. سجّل الدخول.',
  email_exists: 'هذا البريد مسجّل من قبل. سجّل الدخول.',
  over_request_rate_limit: 'محاولات كثيرة. انتظر قليلاً.',
  over_email_send_rate_limit: 'رسائل كثيرة. انتظر قليلاً.',
  bad_jwt: 'انتهت الجلسة. سجّل الدخول من جديد.',
  '42501': 'غير مسموح بهذه العملية.',
  '23505': 'هذا الرقم/المرجع مسجّل من قبل.',
  '23514': 'بعض البيانات غير صالحة.',
};
const rec = (v) => (v && typeof v === 'object' && !Array.isArray(v) ? v : {});

function toError(status, data) {
  const d = rec(data);
  const code = String(d.error_code ?? d.code ?? status);
  const raw = String(d.msg ?? d.message ?? d.error_description ?? d.error ?? '');
  if (code === 'P0001' && raw) return new ApiError(raw, code, status);
  if (/jwt expired/i.test(raw)) return new ApiError(MSG.bad_jwt, 'bad_jwt', status);
  return new ApiError(MSG[code] || 'تعذّر تنفيذ الطلب. حاول مرة أخرى.', code, status);
}

async function call(path, { method = 'GET', body, raw, contentType, token, headers = {}, timeout = 30000 } = {}) {
  if (!backendReady()) throw new ApiError('الخدمة غير مفعّلة بعد.', 'backend_off');
  const h = { apikey: C.anonKey, ...headers };
  if (token) h.Authorization = `Bearer ${token}`;
  let payload;
  if (raw) {
    payload = raw;
    if (contentType) h['Content-Type'] = contentType;
  } else if (body !== undefined) {
    h['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeout);
  let res;
  try {
    res = await fetch(C.url + path, { method, headers: h, body: payload, signal: ctrl.signal });
  } catch {
    throw new ApiError(MSG.network, 'network');
  } finally {
    clearTimeout(t);
  }
  const text = await res.text();
  let data = null;
  if (text) {
    try { data = JSON.parse(text); } catch { data = text; }
  }
  if (!res.ok) throw toError(res.status, data);
  return data;
}

// ───────── الجلسة ─────────
let session = null;
try { session = JSON.parse(localStorage.getItem(SKEY) || 'null'); } catch { session = null; }
const listeners = new Set();
function setSession(s) {
  session = s;
  try { s ? localStorage.setItem(SKEY, JSON.stringify(s)) : localStorage.removeItem(SKEY); } catch { /* التخزين غير متاح */ }
  listeners.forEach((fn) => fn());
}
export const onAuth = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };
export const currentUser = () => (session && session.user ? session.user : null);

function sessionFrom(d) {
  const r = rec(d);
  if (typeof r.access_token !== 'string' || typeof r.refresh_token !== 'string') return null;
  const u = rec(r.user);
  if (!u.id) return null;
  const meta = rec(u.user_metadata);
  return {
    access_token: r.access_token,
    refresh_token: r.refresh_token,
    expires_at: Number(r.expires_at) || Math.floor(Date.now() / 1000) + (Number(r.expires_in) || 3600),
    user: { id: String(u.id), email: String(u.email || ''), name: String(meta.full_name || '') },
  };
}

let refreshing = null;
export async function getToken() {
  if (!session) return null;
  if (session.expires_at - 60 > Date.now() / 1000) return session.access_token;
  if (!refreshing) {
    refreshing = call('/auth/v1/token?grant_type=refresh_token', { method: 'POST', body: { refresh_token: session.refresh_token } })
      .then((d) => {
        const s = sessionFrom(d);
        if (!s) throw new ApiError(MSG.bad_jwt, 'bad_jwt');
        setSession(s);
        return s.access_token;
      })
      .catch((e) => {
        if (!(e instanceof ApiError) || e.code !== 'network') setSession(null);
        return null;
      })
      .finally(() => { refreshing = null; });
  }
  return refreshing;
}

export async function signIn(email, password) {
  const s = sessionFrom(await call('/auth/v1/token?grant_type=password', { method: 'POST', body: { email: email.trim(), password } }));
  if (!s) throw new ApiError(MSG.invalid_credentials, 'invalid_credentials');
  setSession(s);
}
export async function signUp(email, password, name) {
  const d = await call('/auth/v1/signup', { method: 'POST', body: { email: email.trim(), password, data: { full_name: name.trim() } } });
  const s = sessionFrom(d);
  if (s) { setSession(s); return 'signed-in'; }
  return 'confirm';
}
export async function signOut() {
  const token = session && session.access_token;
  setSession(null);
  if (token) { try { await call('/auth/v1/logout?scope=local', { method: 'POST', token }); } catch { /* تم الخروج محلياً */ } }
}

// ───────── بيانات ─────────
async function authed() {
  const token = await getToken();
  if (!token) throw new ApiError(MSG.bad_jwt, 'bad_jwt', 401);
  return token;
}
export const select = async (table, query, withAuth = true) =>
  call(`/rest/v1/${table}?${query}`, { token: withAuth ? await authed() : null });
export const rpc = async (name, args) => call(`/rest/v1/rpc/${name}`, { method: 'POST', body: args || {}, token: await authed() });
export const insert = async (table, row) =>
  call(`/rest/v1/${table}`, { method: 'POST', body: row, token: await authed(), headers: { Prefer: 'return=minimal' } });

export async function uploadReceipt(blob, path) {
  await call(`/storage/v1/object/receipts/${path}`, {
    method: 'POST', raw: blob, contentType: 'image/jpeg', token: await authed(), headers: { 'x-upsert': 'false' }, timeout: 60000,
  });
}
export async function signedReceiptUrl(path) {
  const d = rec(await call(`/storage/v1/object/sign/receipts/${path}`, { method: 'POST', body: { expiresIn: 300 }, token: await authed() }));
  const u = String(d.signedURL || '');
  return u ? `${C.url}/storage/v1${u.startsWith('/') ? '' : '/'}${u}` : '';
}
export async function callFunction(name, body) {
  return call(`/functions/v1/${name}`, { method: 'POST', body, token: await authed() });
}

export async function compressImage(file, maxSide = 1600, quality = 0.82) {
  if (!file.type.startsWith('image/')) throw new ApiError('الملف ليس صورة.');
  let bmp;
  try { bmp = await createImageBitmap(file, { imageOrientation: 'from-image' }); }
  catch { throw new ApiError('تعذّر قراءة الصورة. جرّب صورة أخرى.'); }
  const r = Math.min(1, maxSide / Math.max(bmp.width, bmp.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(bmp.width * r));
  canvas.height = Math.max(1, Math.round(bmp.height * r));
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  bmp.close();
  return new Promise((res, rej) => canvas.toBlob((b) => (b ? res(b) : rej(new ApiError('تعذّر معالجة الصورة.'))), 'image/jpeg', quality));
}

export const errText = (e) => (e instanceof ApiError ? e.message : 'حدث خطأ غير متوقع. حاول مرة أخرى.');
export const siteUrl = () => C.siteUrl || '';

import { BACKEND } from '../config';

// ───────── عميل خفيف لـ Supabase عبر REST (بدون مكتبات إضافية) ─────────

export const backendReady = (): boolean => BACKEND.url.trim() !== '' && BACKEND.anonKey.trim() !== '';
const base = (): string => BACKEND.url.trim().replace(/\/+$/, '');

export class ApiError extends Error {
  code: string;
  status: number;
  constructor(message: string, code: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

export const errorMessage = (e: unknown): string =>
  e instanceof ApiError ? e.message : 'حدث خطأ غير متوقع. حاول مرة أخرى.';

const MESSAGES: Record<string, string> = {
  backend_off: 'الخدمة غير مفعّلة بعد. حاول لاحقاً.',
  network: 'تعذّر الاتصال بالخادم. تحقق من الإنترنت وحاول مجدداً.',
  invalid_credentials: 'البريد الإلكتروني أو كلمة المرور غير صحيحة.',
  email_not_confirmed: 'لم يتم تأكيد بريدك بعد. افتح الرسالة التي وصلتك وأكّد حسابك ثم سجّل الدخول.',
  weak_password: 'كلمة المرور ضعيفة. استعمل 8 أحرف على الأقل مع حروف وأرقام.',
  user_already_exists: 'هذا البريد مسجّل من قبل. جرّب تسجيل الدخول.',
  email_exists: 'هذا البريد مسجّل من قبل. جرّب تسجيل الدخول.',
  over_request_rate_limit: 'محاولات كثيرة. انتظر قليلاً ثم أعد المحاولة.',
  over_email_send_rate_limit: 'تم إرسال رسائل كثيرة. انتظر قليلاً ثم أعد المحاولة.',
  signup_disabled: 'إنشاء الحسابات غير متاح حالياً.',
  validation_failed: 'البيانات المدخلة غير صالحة.',
  bad_jwt: 'انتهت الجلسة. سجّل الدخول من جديد.',
  '42501': 'هذه العملية غير مسموح بها. تأكد من تسجيل الدخول.',
  '23514': 'بعض البيانات غير صالحة. راجع الحقول وأعد المحاولة.',
  '23502': 'بعض الحقول المطلوبة ناقصة.',
  '22001': 'أحد النصوص طويل جداً.',
  '413': 'حجم الملف كبير جداً.',
};

const rec = (v: unknown): Record<string, unknown> =>
  v !== null && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {};

function toApiError(status: number, data: unknown): ApiError {
  const d = rec(data);
  const code = String(d.error_code ?? d.code ?? d.statusCode ?? status);
  const raw = String(d.msg ?? d.message ?? d.error_description ?? d.error ?? '');
  if (code === 'P0001' && raw) return new ApiError(raw, code, status); // رسائل قاعدة البيانات المخصصة (بالعربية)
  if (/jwt expired/i.test(raw)) return new ApiError(MESSAGES.bad_jwt, 'bad_jwt', status);
  const msg = MESSAGES[code] ?? (status === 413 ? MESSAGES['413'] : 'تعذّر تنفيذ الطلب. حاول مرة أخرى.');
  return new ApiError(msg, code, status);
}

interface CallOpts {
  method?: string;
  body?: unknown;
  raw?: Blob;
  contentType?: string;
  token?: string | null;
  headers?: Record<string, string>;
  timeout?: number;
}

async function call<T>(path: string, opts: CallOpts = {}): Promise<T> {
  if (!backendReady()) throw new ApiError(MESSAGES.backend_off, 'backend_off', 0);
  const headers: Record<string, string> = { apikey: BACKEND.anonKey.trim(), ...(opts.headers ?? {}) };
  if (opts.token) headers.Authorization = `Bearer ${opts.token}`;
  let body: BodyInit | undefined;
  if (opts.raw) {
    body = opts.raw;
    if (opts.contentType) headers['Content-Type'] = opts.contentType;
  } else if (opts.body !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(opts.body);
  }
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), opts.timeout ?? 25000);
  let res: Response;
  try {
    res = await fetch(base() + path, { method: opts.method ?? 'GET', headers, body, signal: ctrl.signal });
  } catch {
    throw new ApiError(MESSAGES.network, 'network', 0);
  } finally {
    clearTimeout(timer);
  }
  const text = await res.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }
  if (!res.ok) throw toApiError(res.status, data);
  return data as T;
}

// ───────── الجلسة ─────────
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  phone: string;
}

interface Session {
  access_token: string;
  refresh_token: string;
  expires_at: number; // ثوانٍ (unix)
  user: AuthUser;
}

const SESSION_KEY = 'marsa-session';
const listeners = new Set<() => void>();

function loadSession(): Session | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const s = rec(JSON.parse(raw));
    const u = rec(s.user);
    if (typeof s.access_token !== 'string' || typeof s.refresh_token !== 'string' || typeof u.id !== 'string') return null;
    return {
      access_token: s.access_token,
      refresh_token: s.refresh_token,
      expires_at: Number(s.expires_at) || 0,
      user: { id: u.id, email: String(u.email ?? ''), name: String(u.name ?? ''), phone: String(u.phone ?? '') },
    };
  } catch {
    return null;
  }
}

let session: Session | null = loadSession();

function setSession(s: Session | null) {
  session = s;
  try {
    if (s) localStorage.setItem(SESSION_KEY, JSON.stringify(s));
    else localStorage.removeItem(SESSION_KEY);
  } catch {
    /* التخزين غير متاح */
  }
  listeners.forEach((fn) => fn());
}

export const getCurrentUser = (): AuthUser | null => session?.user ?? null;
export function onAuthChange(fn: () => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

function parseUser(raw: unknown): AuthUser {
  const r = rec(raw);
  const meta = rec(r.user_metadata);
  return {
    id: String(r.id ?? ''),
    email: String(r.email ?? ''),
    name: String(meta.full_name ?? ''),
    phone: String(meta.phone ?? ''),
  };
}

function sessionFrom(raw: unknown): Session | null {
  const r = rec(raw);
  if (typeof r.access_token !== 'string' || typeof r.refresh_token !== 'string') return null;
  const user = parseUser(r.user);
  if (!user.id) return null;
  const exp = Number(r.expires_at) || Math.floor(Date.now() / 1000) + (Number(r.expires_in) || 3600);
  return { access_token: r.access_token, refresh_token: r.refresh_token, expires_at: exp, user };
}

let refreshing: Promise<string | null> | null = null;

/** يعيد رمز الدخول الصالح (ويجدّده تلقائياً عند قرب انتهائه). */
export async function getToken(): Promise<string | null> {
  if (!session) return null;
  if (session.expires_at - 60 > Date.now() / 1000) return session.access_token;
  if (!backendReady()) return null;
  if (!refreshing) {
    const refreshToken = session.refresh_token;
    refreshing = call<unknown>('/auth/v1/token?grant_type=refresh_token', { method: 'POST', body: { refresh_token: refreshToken } })
      .then((data) => {
        const next = sessionFrom(data);
        if (!next) throw new ApiError(MESSAGES.bad_jwt, 'bad_jwt', 401);
        setSession(next);
        return next.access_token;
      })
      .catch((e: unknown) => {
        if (e instanceof ApiError && e.code !== 'network') setSession(null);
        return null;
      })
      .finally(() => {
        refreshing = null;
      });
  }
  return refreshing;
}

export async function signUp(email: string, password: string, name: string): Promise<'signed-in' | 'confirm'> {
  const data = await call<unknown>('/auth/v1/signup', {
    method: 'POST',
    body: { email: email.trim(), password, data: { full_name: name.trim() } },
  });
  const s = sessionFrom(data);
  if (s) {
    setSession(s);
    return 'signed-in';
  }
  return 'confirm';
}

export async function signIn(email: string, password: string): Promise<void> {
  const data = await call<unknown>('/auth/v1/token?grant_type=password', {
    method: 'POST',
    body: { email: email.trim(), password },
  });
  const s = sessionFrom(data);
  if (!s) throw new ApiError(MESSAGES.invalid_credentials, 'invalid_credentials', 400);
  setSession(s);
}

export async function signOut(): Promise<void> {
  const token = session?.access_token;
  setSession(null);
  if (token && backendReady()) {
    try {
      await call<unknown>('/auth/v1/logout?scope=local', { method: 'POST', token });
    } catch {
      /* الجلسة المحلية أُزيلت على أي حال */
    }
  }
}

// ───────── الجداول ─────────
export async function fetchRows<T>(table: string, query: string, withAuth = false): Promise<T[]> {
  const token = withAuth ? await getToken() : null;
  const data = await call<unknown>(`/rest/v1/${table}?${query}`, { token });
  return Array.isArray(data) ? (data as T[]) : [];
}

export async function insertRow(table: string, row: Record<string, unknown>, withAuth: boolean): Promise<Record<string, unknown>> {
  const token = withAuth ? await getToken() : (session ? await getToken() : null);
  if (withAuth && !token) throw new ApiError(MESSAGES.bad_jwt, 'bad_jwt', 401);
  const data = await call<unknown>(`/rest/v1/${table}`, {
    method: 'POST',
    body: row,
    token,
    headers: { Prefer: withAuth ? 'return=representation' : 'return=minimal' },
  });
  return Array.isArray(data) ? rec(data[0]) : {};
}

// ───────── الصور ─────────
const BUCKET = 'listing-images';
const PUBLIC_PREFIX = `/storage/v1/object/public/${BUCKET}/`;

export async function uploadImage(blob: Blob, path: string): Promise<string> {
  const token = await getToken();
  if (!token) throw new ApiError(MESSAGES.bad_jwt, 'bad_jwt', 401);
  await call<unknown>(`/storage/v1/object/${BUCKET}/${path}`, {
    method: 'POST',
    raw: blob,
    contentType: 'image/jpeg',
    token,
    headers: { 'x-upsert': 'false' },
    timeout: 60000,
  });
  return `${base()}${PUBLIC_PREFIX}${path}`;
}

const pathFromUrl = (url: string): string | null => {
  const i = url.indexOf(PUBLIC_PREFIX);
  return i === -1 ? null : url.slice(i + PUBLIC_PREFIX.length);
};

export async function deleteImages(urlsOrPaths: string[]): Promise<void> {
  const token = await getToken();
  if (!token) return;
  const prefixes = urlsOrPaths.map((u) => pathFromUrl(u) ?? u).filter((p) => p && !p.startsWith('http'));
  for (let i = 0; i < prefixes.length; i += 50) {
    try {
      await call<unknown>(`/storage/v1/object/${BUCKET}`, { method: 'DELETE', body: { prefixes: prefixes.slice(i, i + 50) }, token });
    } catch {
      /* محاولة تنظيف فقط */
    }
  }
}

/** حذف الحساب وكل البيانات المرتبطة به (الإعلانات والصور) نهائياً. */
export async function deleteAccount(): Promise<void> {
  const user = getCurrentUser();
  const token = await getToken();
  if (!user || !token) throw new ApiError(MESSAGES.bad_jwt, 'bad_jwt', 401);
  try {
    const mine = await fetchRows<{ images: string[] | null }>('listings', `select=images&user_id=eq.${encodeURIComponent(user.id)}`, true);
    await deleteImages(mine.flatMap((r) => r.images ?? []));
  } catch {
    /* نكمل الحذف حتى لو فشل تنظيف الصور */
  }
  await call<unknown>('/rest/v1/rpc/delete_my_account', { method: 'POST', body: {}, token });
  setSession(null);
}

// ───────── الرصيد (قراءة فقط) ─────────
export async function fetchBalance(): Promise<number | null> {
  const user = getCurrentUser();
  if (!user || !backendReady()) return null;
  const rows = await fetchRows<{ balance: number | string }>('wallets', `select=balance&user_id=eq.${encodeURIComponent(user.id)}`, true);
  if (rows.length === 0) return 0;
  const n = Number(rows[0].balance);
  return Number.isFinite(n) ? n : null;
}

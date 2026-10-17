import { App as CapApp } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';
import { completeOAuthFromUrl, googleAuthUrl } from './api';

// يجب إضافة هذا العنوان نفسه في Supabase ← Authentication ← URL Configuration ← Redirect URLs
export const NATIVE_REDIRECT = 'com.marsa.app://auth-callback';

const fail = () =>
  window.dispatchEvent(new CustomEvent('marsa:auth-error', { detail: 'تعذّر تسجيل الدخول بحساب Google. حاول مرة أخرى.' }));

/** يفتح صفحة Google في متصفح النظام (Google ترفض الدخول داخل WebView). */
export async function startGoogleSignIn(): Promise<void> {
  const native = Capacitor.isNativePlatform();
  const url = googleAuthUrl(native ? NATIVE_REDIRECT : `${window.location.origin}/`);
  if (native) await Browser.open({ url });
  else window.location.assign(url);
}

async function finish(url: string): Promise<void> {
  try {
    if (!(await completeOAuthFromUrl(url))) fail();
  } catch {
    fail();
  }
}

/** يُستدعى مرة عند الإقلاع: يلتقط عودة Google إلى التطبيق. */
export function setupOAuthReturn(): void {
  if (Capacitor.isNativePlatform()) {
    void CapApp.addListener('appUrlOpen', ({ url }) => {
      if (!url.startsWith(NATIVE_REDIRECT)) return;
      void Browser.close().catch(() => { /* غير مدعوم على أندرويد */ });
      void finish(url);
    });
    return;
  }
  if (window.location.hash.includes('access_token=')) {
    void finish(window.location.href).then(() => window.history.replaceState(null, '', window.location.pathname));
  }
}

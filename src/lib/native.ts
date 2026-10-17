import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';

// سلوك زر الرجوع في أندرويد: يغلق النافذة المفتوحة، ثم يرجع لأعلى الصفحة، ثم يخرج من التطبيق.
export function setupNative(): void {
  if (!Capacitor.isNativePlatform()) return;
  void CapApp.addListener('backButton', () => {
    const openDialog = document.querySelector('[role="dialog"],[role="alertdialog"]');
    if (openDialog) {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', bubbles: true }));
      return;
    }
    // الواجهة تعالج الرجوع بين الشاشات (marsa:back) وتلغي الحدث إن فعلت
    if (!window.dispatchEvent(new CustomEvent('marsa:back', { cancelable: true }))) return;
    if (window.scrollY > 120) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    void CapApp.exitApp();
  });
}

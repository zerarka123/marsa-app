// تمرير سلس إلى قسم داخل الصفحة (يعمل في المتصفح وفي تطبيق Capacitor/Android)
export function goTo(id: string, offset = 72) {
  if (!id) {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }
  const el = document.getElementById(id);
  if (!el) return;
  const inset = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--safe-area-inset-top')) || 0;
  const y = el.getBoundingClientRect().top + window.scrollY - offset - inset;
  window.scrollTo({ top: Math.max(y, 0), behavior: 'smooth' });
}

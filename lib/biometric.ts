import { BiometricAuth } from '@aparajita/capacitor-biometric-auth';
import { Capacitor } from '@capacitor/core';

// قفل التطبيق بالبصمة أو الوجه: يُخزَّن الخيار على الجهاز فقط، ولا تغادر أي بيانات حيوية الهاتف.
const KEY = 'marsa-bio-lock';

export const biometricEnabled = (): boolean => {
  try {
    return localStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
};

export function setBiometricEnabled(on: boolean): void {
  try {
    if (on) localStorage.setItem(KEY, '1');
    else localStorage.removeItem(KEY);
  } catch {
    /* التخزين غير متاح */
  }
}

export async function biometricAvailable(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false;
  try {
    const r = await BiometricAuth.checkBiometry();
    return r.isAvailable;
  } catch {
    return false;
  }
}

/** يعرض نافذة النظام للبصمة/الوجه (مع رمز القفل كبديل حتى لا يُحبس المستخدم). */
export async function biometricUnlock(): Promise<boolean> {
  try {
    await BiometricAuth.authenticate({
      reason: 'افتح تطبيق مرسى',
      androidTitle: 'مرسى',
      androidSubtitle: 'أكّد هويتك بالبصمة أو الوجه',
      allowDeviceCredential: true,
    });
    return true;
  } catch {
    return false;
  }
}

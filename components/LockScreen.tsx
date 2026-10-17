import { useCallback, useEffect, useState } from 'react';
import { Fingerprint, LogOut } from 'lucide-react';
import LogoMark from './LogoMark';
import { biometricUnlock } from '../lib/biometric';
import { signOut } from '../lib/api';

export default function LockScreen({ onUnlock }: { onUnlock: () => void }) {
  const [failed, setFailed] = useState(false);

  const attempt = useCallback(async () => {
    setFailed(false);
    if (await biometricUnlock()) onUnlock();
    else setFailed(true);
  }, [onUnlock]);

  // يطلب البصمة تلقائياً عند ظهور الشاشة
  useEffect(() => {
    void attempt();
  }, [attempt]);

  return (
    <div className="splash-bg safe-top safe-bottom fixed inset-0 z-[90] flex flex-col items-center justify-center px-8 text-center text-primary-foreground" dir="rtl">
      <LogoMark className="w-24 h-24 drop-shadow-2xl" />
      <h1 className="font-display font-extrabold text-3xl mt-6">التطبيق مقفل</h1>
      <p className="text-primary-foreground/75 text-sm mt-2 leading-relaxed">
        {failed ? 'لم يتم التحقق. حاول مرة أخرى.' : 'أكّد هويتك بالبصمة أو الوجه لفتح مرسى'}
      </p>
      <button type="button" onClick={() => void attempt()} className="mt-8 flex items-center gap-2 bg-accent text-accent-foreground font-display font-extrabold h-14 px-9 rounded-full shadow-lg">
        <Fingerprint className="w-6 h-6" /> افتح بالبصمة أو الوجه
      </button>
      <button type="button" onClick={() => void signOut()} className="mt-4 flex items-center gap-2 text-primary-foreground/80 text-sm font-bold h-11 px-4">
        <LogOut className="w-4 h-4" /> تسجيل الخروج
      </button>
    </div>
  );
}

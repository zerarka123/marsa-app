import { useState, type FormEvent } from 'react';
import { Eye, EyeOff, Flag, Loader2, Lock, MailCheck, ShieldCheck } from 'lucide-react';
import LogoMark from './LogoMark';
import { backendReady, errorMessage, signIn, signUp } from '../lib/api';
import { useUi } from '../lib/ui';

const field = 'w-full bg-card text-foreground border border-border rounded-2xl px-4 py-3.5 text-base outline-none focus:ring-2 focus:ring-primary/30';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

type Mode = 'signin' | 'signup';

export default function AuthScreen() {
  const { openLegal } = useUi();
  const [mode, setMode] = useState<Mode>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [confirmSent, setConfirmSent] = useState(false);

  const switchMode = (m: Mode) => {
    setMode(m);
    setError('');
  };

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    if (!backendReady()) {
      setError('خدمة الحسابات غير مفعّلة بعد. حاول لاحقاً.');
      return;
    }
    if (!EMAIL_RE.test(email.trim())) {
      setError('اكتب بريداً إلكترونياً صحيحاً.');
      return;
    }
    if (mode === 'signup') {
      if (name.trim().length < 2) {
        setError('اكتب اسمك (حرفان على الأقل).');
        return;
      }
      if (password.length < 8 || !/[A-Za-z\u0600-\u06FF]/.test(password) || !/\d/.test(password)) {
        setError('كلمة المرور: 8 أحرف على الأقل وتحتوي حروفاً وأرقاماً.');
        return;
      }
      if (!consent) {
        setError('يجب الموافقة على شروط الاستخدام وسياسة الخصوصية.');
        return;
      }
    } else if (!password) {
      setError('اكتب كلمة المرور.');
      return;
    }
    setBusy(true);
    try {
      if (mode === 'signup') {
        const r = await signUp(email, password, name);
        if (r === 'confirm') {
          setConfirmSent(true);
          setBusy(false);
        }
      } else {
        await signIn(email, password);
      }
      // عند النجاح يتغيّر المستخدم في السياق فيُستبدل هذا الشاشة تلقائياً بالتطبيق
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-primary" dir="rtl">
      <header className="splash-bg safe-top relative px-6 pt-8 pb-14 text-center text-primary-foreground">
        <LogoMark className="w-20 h-20 mx-auto drop-shadow-xl" />
        <h1 className="font-display font-extrabold text-3xl mt-4">
          {confirmSent ? 'تحقق من بريدك' : mode === 'signin' ? 'أهلاً بعودتك' : 'انضم إلى مرسى'}
        </h1>
        <p className="text-primary-foreground/75 text-sm mt-1.5">
          {mode === 'signin' ? 'سجّل دخولك لتتصفح وتبيع وتشتري' : 'حساب مجاني لعشّاق البحر والصيد والقوارب'}
        </p>
      </header>

      <div className="safe-bottom flex-1 -mt-7 bg-background rounded-t-[2rem]">
        <div className="max-w-md mx-auto px-5 pt-6 pb-10">
          {confirmSent ? (
            <div className="text-center py-6 space-y-4">
              <MailCheck className="w-16 h-16 text-primary mx-auto" />
              <p className="leading-relaxed">
                أرسلنا رسالة تأكيد إلى <b dir="ltr">{email}</b>. افتحها واضغط رابط التأكيد، ثم ارجع هنا وسجّل الدخول.
              </p>
              <p className="text-xs text-muted-foreground">إن لم تجدها فتفقّد مجلد الرسائل غير المرغوبة (Spam).</p>
              <button
                type="button"
                onClick={() => {
                  setConfirmSent(false);
                  switchMode('signin');
                }}
                className="bg-primary text-primary-foreground font-bold px-10 h-12 rounded-full"
              >
                تسجيل الدخول
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 bg-secondary rounded-full p-1" role="tablist">
                {(['signin', 'signup'] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    role="tab"
                    aria-selected={mode === m}
                    onClick={() => switchMode(m)}
                    className={`h-11 rounded-full text-sm font-bold transition-colors ${mode === m ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground'}`}
                  >
                    {m === 'signin' ? 'تسجيل الدخول' : 'حساب جديد'}
                  </button>
                ))}
              </div>

              <form onSubmit={submit} noValidate className="mt-5 space-y-3">
                {mode === 'signup' && (
                  <input value={name} onChange={(e) => setName(e.target.value)} maxLength={60} autoComplete="name" placeholder="الاسم الكامل" aria-label="الاسم الكامل" className={field} />
                )}
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  maxLength={120}
                  placeholder="البريد الإلكتروني"
                  aria-label="البريد الإلكتروني"
                  className={field}
                  dir="ltr"
                />
                <div className="relative">
                  <input
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    type={show ? 'text' : 'password'}
                    autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                    maxLength={72}
                    placeholder={mode === 'signup' ? 'كلمة المرور (8 أحرف على الأقل)' : 'كلمة المرور'}
                    aria-label="كلمة المرور"
                    className={`${field} pe-12`}
                    dir="ltr"
                  />
                  <button
                    type="button"
                    aria-label={show ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                    onClick={() => setShow((v) => !v)}
                    className="absolute end-1 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center text-muted-foreground"
                  >
                    {show ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>

                {mode === 'signup' && (
                  <label className="flex items-start gap-3 text-sm leading-relaxed cursor-pointer pt-1">
                    <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="w-5 h-5 mt-0.5 shrink-0" />
                    <span>
                      أبلغ 18 سنة فأكثر وأوافق على{' '}
                      <button type="button" onClick={() => openLegal('terms')} className="text-primary font-bold underline underline-offset-4">شروط الاستخدام</button>{' '}
                      و{' '}
                      <button type="button" onClick={() => openLegal('privacy')} className="text-primary font-bold underline underline-offset-4">سياسة الخصوصية</button>.
                    </span>
                  </label>
                )}

                {error && <p role="alert" className="text-sm text-destructive font-bold">{error}</p>}

                <button
                  type="submit"
                  disabled={busy}
                  className="w-full bg-accent text-accent-foreground font-display font-extrabold text-lg h-14 rounded-full flex items-center justify-center gap-2 shadow-lg disabled:opacity-60"
                >
                  {busy && <Loader2 className="w-5 h-5 animate-spin" />}
                  {mode === 'signin' ? 'دخول' : 'أنشئ حسابي'}
                </button>
              </form>

              <ul className="mt-8 space-y-3.5 text-sm text-muted-foreground">
                <li className="flex items-center gap-3"><ShieldCheck className="w-5 h-5 text-primary shrink-0" />كل إعلان يُراجَع قبل نشره</li>
                <li className="flex items-center gap-3"><Flag className="w-5 h-5 text-primary shrink-0" />بلّغ عن أي إعلان مشبوه بضغطة واحدة</li>
                <li className="flex items-center gap-3"><Lock className="w-5 h-5 text-primary shrink-0" />بياناتك محمية، ويمكنك حذف حسابك في أي وقت</li>
              </ul>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

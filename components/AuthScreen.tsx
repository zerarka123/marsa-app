import { useEffect, useState, type FormEvent } from 'react';
import { ArrowRight, Eye, EyeOff, Flag, Loader2, Lock, Mail, MailCheck, Phone, ShieldCheck } from 'lucide-react';
import LogoMark from './LogoMark';
import { backendReady, errorMessage, requestPhoneCode, signIn, signUp, verifyPhoneCode } from '../lib/api';
import { normalizePhone } from '../lib/format';
import { startGoogleSignIn } from '../lib/oauth';
import { useUi } from '../lib/ui';

const field = 'w-full bg-card text-foreground border border-border rounded-2xl px-4 py-3.5 text-base outline-none focus:ring-2 focus:ring-primary/30';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MOBILE_RE = /^0[567]\d{8}$/;

type View = 'home' | 'phone' | 'email';
type Mode = 'signin' | 'signup';

export default function AuthScreen() {
  const { openLegal } = useUi();
  const [view, setView] = useState<View>('home');
  const [mode, setMode] = useState<Mode>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [consent, setConsent] = useState(false);
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [confirmSent, setConfirmSent] = useState(false);

  // رسالة فشل قادمة من عودة Google إلى التطبيق
  useEffect(() => {
    const onErr = (e: Event) => {
      const d = (e as CustomEvent<unknown>).detail;
      setError(typeof d === 'string' ? d : 'تعذّر تسجيل الدخول.');
      setBusy(false);
    };
    window.addEventListener('marsa:auth-error', onErr);
    return () => window.removeEventListener('marsa:auth-error', onErr);
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = window.setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => window.clearTimeout(t);
  }, [cooldown]);

  const goView = (v: View) => {
    setView(v);
    setError('');
    setCodeSent(false);
    setCode('');
    setConfirmSent(false);
  };

  const google = async () => {
    setError('');
    if (!backendReady()) {
      setError('خدمة الحسابات غير مفعّلة بعد. حاول لاحقاً.');
      return;
    }
    setBusy(true);
    try {
      await startGoogleSignIn();
    } catch {
      setError('تعذّر فتح صفحة Google. تحقق من الإنترنت.');
    } finally {
      setBusy(false);
    }
  };

  const sendCode = async (e?: FormEvent) => {
    e?.preventDefault();
    setError('');
    const n = normalizePhone(phone);
    if (!MOBILE_RE.test(n)) {
      setError('اكتب رقم هاتف جزائرياً صحيحاً (مثل 0551234567).');
      return;
    }
    if (!backendReady()) {
      setError('خدمة الحسابات غير مفعّلة بعد. حاول لاحقاً.');
      return;
    }
    setBusy(true);
    try {
      await requestPhoneCode(n);
      setCodeSent(true);
      setCooldown(60);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const verify = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!/^\d{6}$/.test(code.trim())) {
      setError('اكتب الرمز المكوّن من 6 أرقام.');
      return;
    }
    setBusy(true);
    try {
      await verifyPhoneCode(normalizePhone(phone), code);
      // عند النجاح يتغيّر المستخدم في السياق فتُستبدل هذه الشاشة بالتطبيق
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  };

  const submitEmail = async (e: FormEvent<HTMLFormElement>) => {
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
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  };

  const title = confirmSent
    ? 'تحقق من بريدك'
    : view === 'home'
      ? 'أهلاً بك في مرسى'
      : view === 'phone'
        ? 'الدخول برقم الهاتف'
        : mode === 'signin'
          ? 'أهلاً بعودتك'
          : 'حساب جديد';

  const legal = (
    <p className="text-xs text-muted-foreground leading-relaxed text-center mt-5">
      بالمتابعة تؤكد أن عمرك 18 سنة فأكثر وتوافق على{' '}
      <button type="button" onClick={() => openLegal('terms')} className="text-primary font-bold underline underline-offset-4">شروط الاستخدام</button>{' '}
      و{' '}
      <button type="button" onClick={() => openLegal('privacy')} className="text-primary font-bold underline underline-offset-4">سياسة الخصوصية</button>.
    </p>
  );

  const errorLine = error && (
    <p role="alert" className="text-sm text-destructive font-bold">{error}</p>
  );

  return (
    <div className="min-h-screen flex flex-col bg-primary" dir="rtl">
      <header className="splash-bg safe-top relative px-6 pt-8 pb-14 text-center text-primary-foreground">
        {view !== 'home' && (
          <button type="button" aria-label="رجوع" onClick={() => goView('home')} className="absolute start-3 top-[max(1rem,env(safe-area-inset-top))] w-11 h-11 flex items-center justify-center rounded-full bg-white/10">
            <ArrowRight className="w-6 h-6" />
          </button>
        )}
        <LogoMark className="w-20 h-20 mx-auto drop-shadow-xl" />
        <h1 className="font-display font-extrabold text-3xl mt-4">{title}</h1>
        <p className="text-primary-foreground/75 text-sm mt-1.5">سوق القوارب والمعدات البحرية في الجزائر</p>
      </header>

      <div className="safe-bottom flex-1 -mt-7 bg-background rounded-t-[2rem]">
        <div className="max-w-md mx-auto px-5 pt-7 pb-10">
          {view === 'home' && (
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => void google()}
                disabled={busy}
                className="w-full h-14 rounded-full bg-card border border-border font-display font-extrabold flex items-center justify-center gap-3 shadow-sm disabled:opacity-60"
              >
                {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : <span className="w-7 h-7 rounded-full bg-white border border-border flex items-center justify-center text-[#4285F4] font-black text-lg leading-none">G</span>}
                المتابعة بحساب Google
              </button>
              <button
                type="button"
                onClick={() => goView('phone')}
                className="w-full h-14 rounded-full bg-primary text-primary-foreground font-display font-extrabold flex items-center justify-center gap-3 shadow-sm"
              >
                <Phone className="w-5 h-5" /> المتابعة برقم الهاتف
              </button>
              <button
                type="button"
                onClick={() => goView('email')}
                className="w-full h-14 rounded-full bg-secondary font-display font-extrabold flex items-center justify-center gap-3"
              >
                <Mail className="w-5 h-5" /> المتابعة بالبريد الإلكتروني
              </button>
              {errorLine}
              {legal}

              <ul className="mt-6 space-y-3.5 text-sm text-muted-foreground">
                <li className="flex items-center gap-3"><ShieldCheck className="w-5 h-5 text-primary shrink-0" />كل إعلان يُراجَع قبل نشره</li>
                <li className="flex items-center gap-3"><Flag className="w-5 h-5 text-primary shrink-0" />بلّغ عن أي إعلان مشبوه بضغطة واحدة</li>
                <li className="flex items-center gap-3"><Lock className="w-5 h-5 text-primary shrink-0" />بياناتك محمية، ويمكنك حذف حسابك في أي وقت</li>
              </ul>
            </div>
          )}

          {view === 'phone' && (
            <div className="space-y-3">
              {!codeSent ? (
                <form onSubmit={(e) => void sendCode(e)} noValidate className="space-y-3">
                  <p className="text-sm text-muted-foreground leading-relaxed">اكتب رقم هاتفك المحمول وسنرسل لك رمز تحقق من 6 أرقام.</p>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    maxLength={20}
                    placeholder="0551234567"
                    aria-label="رقم الهاتف"
                    className={field}
                    dir="ltr"
                  />
                  {errorLine}
                  <button type="submit" disabled={busy} className="w-full bg-accent text-accent-foreground font-display font-extrabold text-lg h-14 rounded-full flex items-center justify-center gap-2 shadow-lg disabled:opacity-60">
                    {busy && <Loader2 className="w-5 h-5 animate-spin" />} أرسل الرمز
                  </button>
                </form>
              ) : (
                <form onSubmit={(e) => void verify(e)} noValidate className="space-y-3">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    أرسلنا رمزاً إلى <b dir="ltr">{normalizePhone(phone)}</b>. اكتبه هنا:
                  </p>
                  <input
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    placeholder="000000"
                    aria-label="رمز التحقق"
                    className={`${field} text-center tracking-[0.5em] text-xl font-bold`}
                    dir="ltr"
                  />
                  {errorLine}
                  <button type="submit" disabled={busy} className="w-full bg-accent text-accent-foreground font-display font-extrabold text-lg h-14 rounded-full flex items-center justify-center gap-2 shadow-lg disabled:opacity-60">
                    {busy && <Loader2 className="w-5 h-5 animate-spin" />} تأكيد ودخول
                  </button>
                  <button type="button" disabled={busy || cooldown > 0} onClick={() => void sendCode()} className="w-full h-11 text-sm font-bold text-primary disabled:text-muted-foreground">
                    {cooldown > 0 ? `إعادة إرسال الرمز بعد ${cooldown} ث` : 'إعادة إرسال الرمز'}
                  </button>
                  <button type="button" onClick={() => { setCodeSent(false); setCode(''); setError(''); }} className="w-full h-11 text-sm font-bold text-muted-foreground">
                    تغيير الرقم
                  </button>
                </form>
              )}
              {legal}
            </div>
          )}

          {view === 'email' &&
            (confirmSent ? (
              <div className="text-center py-6 space-y-4">
                <MailCheck className="w-16 h-16 text-primary mx-auto" />
                <p className="leading-relaxed">
                  أرسلنا رسالة تأكيد إلى <b dir="ltr">{email}</b>. افتحها واضغط رابط التأكيد، ثم ارجع هنا وسجّل الدخول.
                </p>
                <p className="text-xs text-muted-foreground">إن لم تجدها فتفقّد مجلد الرسائل غير المرغوبة (Spam).</p>
                <button type="button" onClick={() => { setConfirmSent(false); setMode('signin'); }} className="bg-primary text-primary-foreground font-bold px-10 h-12 rounded-full">
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
                      onClick={() => { setMode(m); setError(''); }}
                      className={`h-11 rounded-full text-sm font-bold transition-colors ${mode === m ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground'}`}
                    >
                      {m === 'signin' ? 'تسجيل الدخول' : 'حساب جديد'}
                    </button>
                  ))}
                </div>

                <form onSubmit={(e) => void submitEmail(e)} noValidate className="mt-5 space-y-3">
                  {mode === 'signup' && (
                    <input value={name} onChange={(e) => setName(e.target.value)} maxLength={60} autoComplete="name" placeholder="الاسم الكامل" aria-label="الاسم الكامل" className={field} />
                  )}
                  <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" inputMode="email" autoComplete="email" maxLength={120} placeholder="البريد الإلكتروني" aria-label="البريد الإلكتروني" className={field} dir="ltr" />
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
                    <button type="button" aria-label={show ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'} onClick={() => setShow((v) => !v)} className="absolute end-1 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center text-muted-foreground">
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

                  {errorLine}

                  <button type="submit" disabled={busy} className="w-full bg-accent text-accent-foreground font-display font-extrabold text-lg h-14 rounded-full flex items-center justify-center gap-2 shadow-lg disabled:opacity-60">
                    {busy && <Loader2 className="w-5 h-5 animate-spin" />}
                    {mode === 'signin' ? 'دخول' : 'أنشئ حسابي'}
                  </button>
                </form>
              </>
            ))}
        </div>
      </div>
    </div>
  );
}

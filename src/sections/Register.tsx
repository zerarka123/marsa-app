import { useState, type FormEvent } from 'react';
import { BadgeCheck, Building2, CheckCircle2, Hammer, HardHat, Loader2, Settings, Truck } from 'lucide-react';
import Reveal from '../components/Reveal';
import { wilayas, type BusinessKind } from '../data';
import { backendReady, errorMessage, insertRow } from '../lib/api';
import { useAuth } from '../lib/auth';
import { normalizePhone } from '../lib/format';
import { useUi } from '../lib/ui';

const kinds: { id: BusinessKind; label: string; text: string; icon: typeof Truck }[] = [
  { id: 'مورّد', label: 'مورّد', text: 'معدات الصيد والبحر', icon: Truck },
  { id: 'ورشة بناء سفن', label: 'ورشة بناء سفن', text: 'بناء وصيانة القوارب', icon: Hammer },
  { id: 'قطع غيار', label: 'محل قطع غيار', text: 'محركات وقطع ولواحق', icon: Settings },
  { id: 'شركة ميكانيك', label: 'شركة ميكانيك', text: 'صيانة المحركات البحرية', icon: Building2 },
  { id: 'ورشة ميكانيك', label: 'ورشة ميكانيك خاصة', text: 'ميكانيكي مستقل', icon: HardHat },
];

const field = 'w-full bg-background text-foreground border border-border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30';

interface FormState {
  name: string;
  wilaya: string;
  address: string;
  phone: string;
  specialties: string;
  hours: string;
}
const EMPTY: FormState = { name: '', wilaya: '', address: '', phone: '', specialties: '', hours: '' };

export default function Register() {
  const { user, openAuth } = useAuth();
  const { openLegal } = useUi();
  const [kind, setKind] = useState<BusinessKind>(kinds[0].id);
  const [f, setF] = useState<FormState>(EMPTY);
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const set = <K extends keyof FormState>(k: K, v: string) => setF((p) => ({ ...p, [k]: v }));

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    if (!backendReady()) return setError('خدمة التسجيل غير مفعّلة بعد. حاول لاحقاً.');
    if (!user) return openAuth('signup');
    if (f.name.trim().length < 2) return setError('اكتب اسم النشاط.');
    if (!f.wilaya) return setError('اختر الولاية.');
    const phone = normalizePhone(f.phone);
    if (!phone) return setError('رقم الهاتف غير صالح. مثال: 0550123456');
    if (!consent) return setError('يجب الموافقة على شروط الاستخدام.');
    const specialties = f.specialties
      .split(/[,،\n]/)
      .map((s) => s.trim().slice(0, 40))
      .filter(Boolean)
      .slice(0, 10);

    setBusy(true);
    try {
      await insertRow(
        'businesses',
        {
          name: f.name.trim(),
          kind,
          wilaya: f.wilaya,
          address: f.address.trim(),
          phone,
          specialties,
          hours: f.hours.trim(),
        },
        true,
      );
      setDone(true);
      setF(EMPTY);
      setConsent(false);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section id="register" className="py-16 md:py-24 bg-secondary/40 scroll-mt-16">
      <div className="max-w-3xl mx-auto px-5 md:px-8">
        <Reveal>
          <h2 className="font-display font-extrabold text-3xl md:text-4xl">سجّل نشاطك</h2>
          <p className="text-muted-foreground mt-2 leading-relaxed">
            للموردين وشركات وورشات ميكانيك السفن وورشات بناء السفن ومحلات قطع الغيار: سجّل لتظهر في الدليل البحري ويصلك المشترون مباشرة.
            تتم مراجعة كل نشاط قبل ظهوره.
          </p>
        </Reveal>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-8">
          {kinds.map((k) => (
            <button
              key={k.id}
              type="button"
              aria-pressed={kind === k.id}
              onClick={() => setKind(k.id)}
              className={`rounded-2xl border-2 p-3 sm:p-4 text-center transition-colors last:col-span-2 sm:last:col-span-1 ${
                kind === k.id ? 'border-primary bg-card' : 'border-border bg-card/60'
              }`}
            >
              <k.icon className="w-6 h-6 mx-auto text-primary" />
              <div className="font-display font-bold text-sm mt-2">{k.label}</div>
              <div className="text-[11px] text-muted-foreground mt-1 hidden sm:block">{k.text}</div>
            </button>
          ))}
        </div>

        <div className="mt-6 bg-card border border-border rounded-2xl p-5">
          {done ? (
            <div className="text-center py-6 space-y-3">
              <CheckCircle2 className="w-14 h-14 text-primary mx-auto" />
              <h3 className="font-display font-extrabold text-2xl">تم استلام طلب التسجيل</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">سنراجع بيانات نشاطك ويظهر في الدليل بعد الموافقة.</p>
              <button type="button" onClick={() => setDone(false)} className="bg-primary text-primary-foreground font-bold px-8 h-11 rounded-full">
                تسجيل نشاط آخر
              </button>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-3" noValidate>
              {!user && (
                <div className="bg-accent/15 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                  <p className="text-sm leading-relaxed flex-1">لتسجيل نشاطك تحتاج إلى حساب مجاني.</p>
                  <button
                    type="button"
                    onClick={() => openAuth('signup')}
                    className="flex items-center justify-center gap-2 bg-accent text-accent-foreground font-display font-extrabold px-5 h-11 rounded-full shrink-0"
                  >
                    <BadgeCheck className="w-5 h-5" /> افتح حسابك مجانا
                  </button>
                </div>
              )}
              <input value={f.name} onChange={(e) => set('name', e.target.value)} maxLength={120} placeholder="اسم النشاط" aria-label="اسم النشاط" className={field} />
              <select value={f.wilaya} onChange={(e) => set('wilaya', e.target.value)} aria-label="الولاية" className={field}>
                <option value="" disabled>الولاية</option>
                {wilayas.slice(1).map((w) => <option key={w} value={w}>{w}</option>)}
              </select>
              <input value={f.address} onChange={(e) => set('address', e.target.value)} maxLength={200} placeholder="العنوان (اختياري)" aria-label="العنوان" className={field} />
              <input value={f.phone} onChange={(e) => set('phone', e.target.value)} type="tel" inputMode="tel" maxLength={20} placeholder="رقم الهاتف (يظهر للجميع)" aria-label="رقم الهاتف" className={field} dir="ltr" />
              <input value={f.hours} onChange={(e) => set('hours', e.target.value)} maxLength={100} placeholder="ساعات العمل (اختياري)" aria-label="ساعات العمل" className={field} />
              <textarea value={f.specialties} onChange={(e) => set('specialties', e.target.value)} maxLength={400} rows={3} placeholder="التخصصات والخدمات، افصل بينها بفاصلة: محركات ياماها، فايبر، سونار" aria-label="التخصصات" className={`${field} resize-none`} />

              <label className="flex items-start gap-3 text-sm leading-relaxed cursor-pointer">
                <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="w-5 h-5 mt-0.5 shrink-0" />
                <span>
                  أقرّ بصحة البيانات وأوافق على{' '}
                  <button type="button" onClick={() => openLegal('terms')} className="text-primary font-bold underline underline-offset-4">شروط الاستخدام</button>.
                </span>
              </label>

              {error && <p role="alert" className="text-sm text-destructive font-bold">{error}</p>}

              <button
                type="submit"
                disabled={busy}
                className="w-full bg-accent text-accent-foreground font-display font-extrabold py-3.5 rounded-xl flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {busy && <Loader2 className="w-4 h-4 animate-spin" />}
                أرسل طلب التسجيل
              </button>
            </form>
          )}
        </div>
      </div>

    </section>
  );
}

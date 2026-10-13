import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { BadgeCheck, Camera, CheckCircle2, ClipboardList, Handshake, Loader2, X } from 'lucide-react';
import Reveal from '../components/Reveal';
import { wilayas } from '../data';
import { backendReady, deleteImages, errorMessage, insertRow, uploadImage } from '../lib/api';
import { useAuth } from '../lib/auth';
import { categoryMeta } from '../lib/categories';
import { compressImage, normalizePhone } from '../lib/format';
import { useUi } from '../lib/ui';

const MAX_PHOTOS = 10;
const MAX_INPUT_BYTES = 25 * 1024 * 1024;
const input = 'bg-background text-foreground border border-border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30';

interface FormState {
  title: string;
  category: string;
  wilaya: string;
  price: string;
  year: string;
  length: string;
  engine: string;
  fuel: string;
  name: string;
  phone: string;
  condition: 'مستعمل' | 'جديد';
  negotiable: boolean;
  description: string;
}

const EMPTY: FormState = {
  title: '', category: '', wilaya: '', price: '', year: '', length: '', engine: '', fuel: '—',
  name: '', phone: '', condition: 'مستعمل', negotiable: false, description: '',
};

interface Photo {
  file: File;
  url: string;
}

export default function Sell() {
  const { user, openAuth } = useAuth();
  const { openLegal } = useUi();
  const [f, setF] = useState<FormState>(EMPTY);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);
  const specsRef = useRef<HTMLTextAreaElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const photosRef = useRef<Photo[]>([]);
  photosRef.current = photos;

  // تحرير روابط الصور المؤقتة عند مغادرة الصفحة
  useEffect(() => () => photosRef.current.forEach((p) => URL.revokeObjectURL(p.url)), []);

  // تعبئة الاسم تلقائياً بعد تسجيل الدخول
  const userName = user?.name ?? '';
  useEffect(() => {
    if (userName) setF((p) => (p.name ? p : { ...p, name: userName }));
  }, [userName]);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setF((p) => ({ ...p, [k]: v }));

  const addPhotos = (e: ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files ?? []);
    e.target.value = '';
    const valid = picked.filter((file) => file.type.startsWith('image/') && file.size <= MAX_INPUT_BYTES);
    if (valid.length < picked.length) setError('بعض الملفات تم تجاهلها: يجب أن تكون صوراً وبحجم أقل من 25 ميغابايت.');
    else setError('');
    setPhotos((prev) => {
      const room = Math.max(MAX_PHOTOS - prev.length, 0);
      const next = valid.slice(0, room).map((file) => ({ file, url: URL.createObjectURL(file) }));
      return [...prev, ...next];
    });
  };

  const removePhoto = (index: number) => {
    URL.revokeObjectURL(photos[index].url);
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const goToForm = () => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  // الخطوات الثلاث قابلة للضغط
  const steps = [
    {
      icon: Camera, title: 'صوّر قاربك', text: 'صور واضحة من كل الزوايا + المحرك والأوراق',
      run: () => { goToForm(); setTimeout(() => document.getElementById('sell-photos')?.click(), 350); },
    },
    {
      icon: ClipboardList, title: 'املأ المواصفات', text: 'الطول، المحرك، السنة، السعر — بدقة',
      run: () => { goToForm(); setTimeout(() => specsRef.current?.focus(), 400); },
    },
    {
      icon: Handshake, title: 'استقبل المشترين', text: 'اتصالات مباشرة بدون وسطاء ولا عمولة على البيع',
      run: () => { goToForm(); setTimeout(() => phoneRef.current?.focus(), 400); },
    },
  ];

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    if (!backendReady()) {
      setError('خدمة النشر غير مفعّلة بعد. حاول لاحقاً.');
      return;
    }
    if (!user) {
      openAuth('signup');
      return;
    }
    const title = f.title.trim();
    if (title.length < 5) return setError('اكتب عنواناً واضحاً للإعلان (5 أحرف على الأقل).');
    if (!f.category) return setError('اختر الفئة.');
    if (!f.wilaya) return setError('اختر الولاية.');
    const price = Number(f.price);
    if (!Number.isFinite(price) || price < 1 || price > 1_000_000_000) return setError('اكتب سعراً صحيحاً بالدينار.');
    const thisYear = new Date().getFullYear();
    const year = f.year ? Number(f.year) : null;
    if (year !== null && (!Number.isInteger(year) || year < 1950 || year > thisYear + 1)) return setError('سنة الصنع غير صحيحة.');
    const length = f.length ? Number(f.length.replace(',', '.')) : null;
    if (length !== null && (!Number.isFinite(length) || length <= 0 || length > 200)) return setError('الطول غير صحيح (بالمتر).');
    if (f.name.trim().length < 2) return setError('اكتب اسمك.');
    const phone = normalizePhone(f.phone);
    if (!phone) return setError('رقم الهاتف غير صالح. مثال: 0550123456');
    if (photos.length === 0) return setError('أضف صورة واحدة على الأقل للقارب.');
    if (!consent) return setError('يجب الموافقة على شروط الاستخدام قبل النشر.');

    setBusy(true);
    const uploaded: string[] = [];
    try {
      const stamp = Date.now();
      for (let i = 0; i < photos.length; i++) {
        setProgress(`رفع الصور ${i + 1} / ${photos.length}…`);
        const blob = await compressImage(photos[i].file);
        uploaded.push(await uploadImage(blob, `${user.id}/${stamp}-${i}.jpg`));
      }
      setProgress('إرسال الإعلان…');
      await insertRow(
        'listings',
        {
          title,
          category: f.category,
          wilaya: f.wilaya,
          price: Math.round(price),
          year,
          length_m: length,
          condition: f.condition,
          negotiable: f.negotiable,
          engine: f.engine.trim(),
          fuel: f.fuel,
          description: f.description.trim(),
          seller_name: f.name.trim(),
          seller_phone: phone,
          images: uploaded,
        },
        true,
      );
      photos.forEach((p) => URL.revokeObjectURL(p.url));
      setPhotos([]);
      setF({ ...EMPTY, name: f.name, phone: f.phone });
      setConsent(false);
      setDone(true);
    } catch (err) {
      if (uploaded.length) void deleteImages(uploaded);
      setError(errorMessage(err));
    } finally {
      setBusy(false);
      setProgress('');
    }
  };

  return (
    <section id="vendre" className="py-20 md:py-28 bg-secondary/60">
      <div className="max-w-7xl mx-auto px-5 md:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-start">
          <div>
            <Reveal>
              <div className="flex items-baseline gap-4 mb-2">
                <span className="font-display font-extrabold text-accent text-sm">03</span>
                <h2 className="font-display font-extrabold text-3xl md:text-5xl">بِع قاربك</h2>
              </div>
              <p className="text-muted-foreground max-w-md leading-relaxed">
                إعلانك يصل إلى البحّارة والمشترين الجادين في الولايات الساحلية.{' '}
                التواصل مباشر بينك وبين المشتري بدون عمولة على البيع.{' '}
                تتم مراجعة كل إعلان قبل ظهوره.
              </p>
            </Reveal>

            <div className="mt-10 space-y-4">
              {steps.map((s, i) => (
                <Reveal key={s.title} delay={i * 0.12}>
                  <button
                    type="button"
                    onClick={s.run}
                    className="w-full flex gap-5 text-start p-3 -m-3 rounded-2xl transition-colors hover:bg-card/70 active:bg-card"
                  >
                    <span className="shrink-0 w-11 h-11 rounded-full border-2 border-primary flex items-center justify-center">
                      <s.icon className="w-5 h-5 text-primary" />
                    </span>
                    <span>
                      <span className="block font-display font-bold text-lg">{s.title}</span>
                      <span className="block text-muted-foreground text-sm mt-1 leading-relaxed">{s.text}</span>
                    </span>
                  </button>
                </Reveal>
              ))}
            </div>
          </div>

          <Reveal delay={0.15}>
            <div id="sell-form" ref={formRef} className="scroll-mt-24 bg-card border border-border rounded-2xl p-6 md:p-8 shadow-lg">
              {done ? (
                <div className="text-center py-8 space-y-3">
                  <CheckCircle2 className="w-14 h-14 text-primary mx-auto" />
                  <h3 className="font-display font-extrabold text-2xl">تم استلام إعلانك</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    سنراجعه وينشر بعد الموافقة (عادةً خلال 24 ساعة). شكراً لثقتك بمرسى.
                  </p>
                  <button type="button" onClick={() => setDone(false)} className="bg-primary text-primary-foreground font-bold px-8 h-11 rounded-full">
                    أضف إعلاناً آخر
                  </button>
                </div>
              ) : (
                <form onSubmit={submit} className="space-y-4" noValidate>
                  <h3 className="font-display font-extrabold text-xl">أضف إعلانك</h3>

                  {!user && (
                    <div className="bg-accent/15 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                      <p className="text-sm leading-relaxed flex-1">لنشر إعلان تحتاج إلى حساب مجاني. يستغرق دقيقة واحدة.</p>
                      <button
                        type="button"
                        onClick={() => openAuth('signup')}
                        className="flex items-center justify-center gap-2 bg-accent text-accent-foreground font-display font-extrabold px-5 h-11 rounded-full shrink-0"
                      >
                        <BadgeCheck className="w-5 h-5" /> افتح حسابك مجانا
                      </button>
                    </div>
                  )}

                  <input value={f.title} onChange={(e) => set('title', e.target.value)} maxLength={100} placeholder="عنوان الإعلان (مثال: قارب صيد 8م بمحرك ياماها)" aria-label="عنوان الإعلان" className={`w-full ${input}`} />
                  <div className="grid grid-cols-2 gap-3">
                    <select value={f.category} onChange={(e) => set('category', e.target.value)} aria-label="الفئة" className={`col-span-2 sm:col-span-1 ${input}`}>
                      <option value="" disabled>الفئة</option>
                      {categoryMeta.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
                    </select>
                    <select value={f.wilaya} onChange={(e) => set('wilaya', e.target.value)} aria-label="الولاية" className={`col-span-2 sm:col-span-1 ${input}`}>
                      <option value="" disabled>الولاية</option>
                      {wilayas.slice(1).map((w) => <option key={w} value={w}>{w}</option>)}
                    </select>
                    <input value={f.price} onChange={(e) => set('price', e.target.value.replace(/\D/g, '').slice(0, 10))} inputMode="numeric" placeholder="السعر (دج)" aria-label="السعر بالدينار" className={`col-span-2 sm:col-span-1 ${input}`} />
                    <input value={f.length} onChange={(e) => set('length', e.target.value.replace(/[^\d.,]/g, '').slice(0, 6))} inputMode="decimal" placeholder="الطول بالمتر (اختياري)" aria-label="الطول بالمتر" className={`col-span-2 sm:col-span-1 ${input}`} />
                    <input value={f.year} onChange={(e) => set('year', e.target.value.replace(/\D/g, '').slice(0, 4))} inputMode="numeric" placeholder="سنة الصنع (اختياري)" aria-label="سنة الصنع" className={`col-span-2 sm:col-span-1 ${input}`} />
                    <select value={f.fuel} onChange={(e) => set('fuel', e.target.value)} aria-label="الوقود" className={`col-span-2 sm:col-span-1 ${input}`}>
                      <option value="—">الوقود (اختياري)</option>
                      <option value="بنزين">بنزين</option>
                      <option value="مازوت">مازوت</option>
                    </select>
                    <input value={f.engine} onChange={(e) => set('engine', e.target.value)} maxLength={100} placeholder="المحرك (اختياري)" aria-label="المحرك" className={`col-span-2 ${input}`} />
                    <input value={f.name} onChange={(e) => set('name', e.target.value)} maxLength={60} autoComplete="name" placeholder="اسمك" aria-label="اسمك" className={`col-span-2 sm:col-span-1 ${input}`} />
                    <input ref={phoneRef} value={f.phone} onChange={(e) => set('phone', e.target.value)} type="tel" inputMode="tel" autoComplete="tel" maxLength={20} placeholder="رقم الهاتف" aria-label="رقم الهاتف" className={`col-span-2 sm:col-span-1 ${input}`} dir="ltr" />
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">رقم هاتفك سيظهر للجميع في الإعلان حتى يتصل بك المشترون.</p>
                  <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
                    <label className="flex items-center gap-2 h-11"><input type="radio" name="cond" checked={f.condition === 'مستعمل'} onChange={() => set('condition', 'مستعمل')} className="w-4 h-4" /> مستعمل</label>
                    <label className="flex items-center gap-2 h-11"><input type="radio" name="cond" checked={f.condition === 'جديد'} onChange={() => set('condition', 'جديد')} className="w-4 h-4" /> جديد</label>
                    <label className="flex items-center gap-2 h-11"><input type="checkbox" checked={f.negotiable} onChange={(e) => set('negotiable', e.target.checked)} className="w-4 h-4" /> السعر قابل للتفاوض</label>
                  </div>
                  <textarea ref={specsRef} value={f.description} onChange={(e) => set('description', e.target.value)} maxLength={2000} rows={3} placeholder="وصف القارب: الحالة، المحرك، التجهيزات…" aria-label="وصف القارب" className={`w-full resize-none ${input}`} />

                  <input id="sell-photos" type="file" accept="image/*" multiple onChange={addPhotos} className="sr-only" />
                  <label
                    htmlFor="sell-photos"
                    className={`block w-full border-2 border-dashed border-border rounded-xl p-6 text-center text-muted-foreground text-sm cursor-pointer hover:border-primary hover:text-primary transition-colors ${
                      photos.length >= MAX_PHOTOS ? 'opacity-50 pointer-events-none' : ''
                    }`}
                  >
                    <Camera className="w-6 h-6 mx-auto mb-2" />
                    {photos.length === 0 ? 'أضف صور القارب (حتى 10 صور)' : `${photos.length} / ${MAX_PHOTOS} صور — اضغط لإضافة المزيد`}
                  </label>
                  {photos.length > 0 && (
                    <div className="grid grid-cols-4 gap-2">
                      {photos.map((p, i) => (
                        <div key={p.url} className="relative aspect-square rounded-lg overflow-hidden border border-border">
                          <img src={p.url} alt="" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => removePhoto(i)}
                            aria-label="حذف الصورة"
                            className="absolute top-1 left-1 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <label className="flex items-start gap-3 text-sm leading-relaxed cursor-pointer">
                    <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="w-5 h-5 mt-0.5 shrink-0" />
                    <span>
                      أقرّ بأن الإعلان صحيح ولا يخالف{' '}
                      <button type="button" onClick={() => openLegal('terms')} className="text-primary font-bold underline underline-offset-4">شروط الاستخدام</button>.
                    </span>
                  </label>

                  {error && <p role="alert" className="text-sm text-destructive font-bold">{error}</p>}

                  <button
                    type="submit"
                    disabled={busy}
                    className="w-full bg-accent text-accent-foreground font-display font-extrabold text-base py-3.5 rounded-xl transition-transform active:scale-95 flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {busy && <Loader2 className="w-4 h-4 animate-spin" />}
                    {busy ? progress || 'جارٍ الإرسال…' : 'انشر إعلانك'}
                  </button>
                </form>
              )}
            </div>
          </Reveal>
        </div>
      </div>

    </section>
  );
}

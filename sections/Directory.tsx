import { PLAY_BUILD } from '../config';
import { useMemo, useState } from 'react';
import { BadgeCheck, Building2, Clock, Flag, Hammer, HardHat, Loader2, MapPin, MessageCircle, Package, Phone, Plus, Search, Settings, Truck, Wrench } from 'lucide-react';
import Reveal from '../components/Reveal';
import { mechanicKinds, wilayas, type BusinessKind } from '../data';
import { telHref, waHref } from '../lib/format';
import { useRemote } from '../lib/remote';
import { useUi } from '../lib/ui';

const kindIcon: Record<BusinessKind, typeof Hammer> = {
  'مورّد': Truck,
  'ورشة بناء سفن': Hammer,
  'قطع غيار': Settings,
  'شركة ميكانيك': Building2,
  'ورشة ميكانيك': HardHat,
};

// النص الظاهر على بطاقة كل نشاط
const kindText: Record<BusinessKind, string> = {
  'مورّد': 'مورّد',
  'ورشة بناء سفن': 'ورشة بناء سفن',
  'قطع غيار': 'محل قطع غيار',
  'شركة ميكانيك': 'شركة ميكانيك',
  'ورشة ميكانيك': 'ورشة ميكانيك خاصة',
};

type Group = BusinessKind | 'ميكانيك';

// الأقسام الرئيسية في الدليل. «ميكانيك السفن» قسم له فرعان: الشركات والورشات الخاصة.
const groups: { id: Group; label: string; icon: typeof Hammer }[] = [
  { id: 'مورّد', label: 'الموردون', icon: Truck },
  { id: 'ميكانيك', label: 'ميكانيك السفن', icon: Wrench },
  { id: 'ورشة بناء سفن', label: 'ورشات بناء السفن', icon: Hammer },
  { id: 'قطع غيار', label: 'محلات قطع الغيار', icon: Settings },
];

const mechanicTabs: { id: BusinessKind; label: string }[] = [
  { id: 'شركة ميكانيك', label: 'شركات الميكانيك' },
  { id: 'ورشة ميكانيك', label: 'ورشات الميكانيك الخاصة' },
];

interface Props {
  query: string;
  wilaya: string;
  setWilaya: (w: string) => void;
}

export default function Directory({ query, wilaya, setWilaya }: Props) {
  const { businesses, loading, ready } = useRemote();
  const { openReport } = useUi();
  const [group, setGroup] = useState<Group | 'الكل'>('الكل');
  const [mech, setMech] = useState<BusinessKind | 'الكل'>('الكل');
  const [q, setQ] = useState('');

  const list = useMemo(() => {
    const text = (q || query).trim();
    return businesses.filter((b) => {
      if (group === 'ميكانيك') {
        if (!mechanicKinds.includes(b.kind)) return false;
        if (mech !== 'الكل' && b.kind !== mech) return false;
      } else if (group !== 'الكل' && b.kind !== group) {
        return false;
      }
      if (wilaya !== 'الكل' && b.wilaya !== wilaya) return false;
      if (text && !(b.name + b.specialties.join(' ') + b.wilaya + b.kind).includes(text)) return false;
      return true;
    });
  }, [businesses, group, mech, wilaya, q, query]);

  const mechanicsTotal = useMemo(() => businesses.filter((b) => mechanicKinds.includes(b.kind)).length, [businesses]);
  const countOf = (k: BusinessKind) => businesses.filter((b) => b.kind === k).length;

  const field = 'w-full bg-background border border-border rounded-xl px-4 h-12 text-sm outline-none focus:ring-2 focus:ring-primary/30';

  return (
    <section id="dalil" className="py-16 md:py-24 bg-secondary/60">
      <div className="max-w-7xl mx-auto px-5 md:px-8">
        <Reveal>
          <div className="flex items-baseline gap-4 mb-2">
            <h2 className="font-display font-extrabold text-3xl md:text-5xl">الدليل البحري</h2>
          </div>
          <p className="text-muted-foreground max-w-xl leading-relaxed">
            موردون، ميكانيك السفن، ورشات بناء وصيانة السفن، ومحلات قطع الغيار في الولايات الساحلية — اتصل بهم مباشرة.
          </p>
        </Reveal>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-8">
          {groups.map((g) => {
            const Icon = g.icon;
            const active = group === g.id;
            return (
              <button
                type="button"
                key={g.id}
                aria-pressed={active}
                onClick={() => {
                  setGroup(active ? 'الكل' : g.id);
                  setMech('الكل');
                }}
                className={`flex flex-col items-center gap-2 rounded-2xl border-2 py-4 px-2 min-h-[96px] transition-colors ${
                  active ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border hover:border-primary'
                }`}
              >
                <Icon className="w-7 h-7" strokeWidth={1.8} />
                <span className="text-sm font-bold text-center leading-tight">{g.label}</span>
              </button>
            );
          })}
        </div>

        {group === 'ميكانيك' && (
          <div className="mt-3 bg-card border border-border rounded-2xl p-3" role="group" aria-label="فروع ميكانيك السفن">
            <p className="text-xs text-muted-foreground mb-2">ميكانيك السفن — اختر الفرع:</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                aria-pressed={mech === 'الكل'}
                onClick={() => setMech('الكل')}
                className={`h-11 px-4 rounded-full text-sm font-bold border-2 transition-colors ${
                  mech === 'الكل' ? 'bg-accent text-accent-foreground border-accent' : 'border-border hover:border-primary'
                }`}
              >
                الكل ({mechanicsTotal})
              </button>
              {mechanicTabs.map((t) => (
                <button
                  type="button"
                  key={t.id}
                  aria-pressed={mech === t.id}
                  onClick={() => setMech(t.id)}
                  className={`h-11 px-4 rounded-full text-sm font-bold border-2 transition-colors ${
                    mech === t.id ? 'bg-accent text-accent-foreground border-accent' : 'border-border hover:border-primary'
                  }`}
                >
                  {t.label} ({countOf(t.id)})
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-2 mt-4">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-muted-foreground absolute top-1/2 -translate-y-1/2 start-4" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="ابحث: ياماها، فايبر، سونار…"
              aria-label="بحث في الدليل"
              className={`${field} ps-11 bg-card`}
            />
          </div>
          <select
            aria-label="الولاية"
            value={wilaya}
            onChange={(e) => setWilaya(e.target.value)}
            className="bg-card border border-border rounded-xl px-4 h-12 text-sm font-medium outline-none"
          >
            {wilayas.map((w) => (
              <option key={w} value={w}>{w === 'الكل' ? 'كل الولايات' : w}</option>
            ))}
          </select>
        </div>

        <p className="font-bold text-sm mt-5">{list.length} نتيجة</p>

        {loading ? (
          <div className="flex flex-col items-center py-14 text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin mb-3" />
          </div>
        ) : list.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-3">
            {list.map((b) => {
              const Icon = kindIcon[b.kind];
              const tel = telHref(b.phone);
              const wa = waHref(b.phone);
              return (
                <div key={b.id} className="bg-card border border-border rounded-2xl p-5 flex flex-col">
                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-display font-bold leading-snug flex items-center gap-1.5">
                        <span className="break-words">{b.name}</span>
                        {b.verified && <BadgeCheck className="w-4 h-4 text-primary shrink-0" />}
                      </h3>
                      <span className="text-xs text-muted-foreground">{kindText[b.kind]}</span>
                    </div>
                    <button
                      type="button"
                      aria-label="إبلاغ عن هذا النشاط"
                      onClick={() => openReport({ type: 'business', id: b.id, label: b.name })}
                      className="w-11 h-11 -m-2 flex items-center justify-center text-muted-foreground shrink-0"
                    >
                      <Flag className="w-4 h-4" />
                    </button>
                  </div>
                  {b.specialties.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {b.specialties.map((s) => (
                        <span key={s} className="bg-secondary text-xs font-medium px-2.5 py-1 rounded-full">{s}</span>
                      ))}
                    </div>
                  )}
                  <div className="text-sm text-muted-foreground mt-3 space-y-1">
                    <p className="flex items-center gap-1.5"><MapPin className="w-4 h-4 shrink-0" /> {b.wilaya}{b.address ? ` — ${b.address}` : ''}</p>
                    {b.hours && <p className="flex items-center gap-1.5"><Clock className="w-4 h-4 shrink-0" /> {b.hours}</p>}
                  </div>
                  <div className="flex gap-2 mt-4 pt-4 border-t border-border">
                    {tel && (
                      <a href={tel} className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground font-bold text-sm h-11 rounded-full">
                        <Phone className="w-4 h-4" /> اتصل
                      </a>
                    )}
                    {wa && (
                      <a
                        href={wa}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="واتساب"
                        className="w-11 h-11 flex items-center justify-center border-2 border-primary text-primary rounded-full"
                      >
                        <MessageCircle className="w-5 h-5" />
                      </a>
                    )}
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([b.name, b.address, b.wilaya, 'الجزائر'].filter(Boolean).join(' '))}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="الموقع على الخريطة"
                      className="w-11 h-11 flex items-center justify-center border-2 border-primary text-primary rounded-full"
                    >
                      <MapPin className="w-5 h-5" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center py-14 text-center">
            <Package className="w-10 h-10 text-muted-foreground mb-3" />
            <p className="font-display font-bold text-lg">
              {businesses.length === 0 ? 'الدليل فارغ حالياً' : 'لا توجد نتائج مطابقة'}
            </p>
            <p className="text-muted-foreground text-sm mt-1">
              {!ready ? 'الخدمة قيد التفعيل' : PLAY_BUILD ? 'جرّب ولاية أخرى' : 'كن أول من يسجّل نشاطه هنا'}
            </p>
          </div>
        )}

        {!PLAY_BUILD && (
        <div className="mt-8 bg-primary text-primary-foreground rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="font-display font-extrabold text-xl">عندك ورشة أو شركة ميكانيك أو محل أو تورّد معدات بحرية؟</h3>
            <p className="text-primary-foreground/75 text-sm mt-1">
              سجّل نشاطك ليظهر في الدليل ويصل إليك الصيادون وأصحاب القوارب.
            </p>
          </div>
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent('marsa:go', { detail: 'register' }))}
            className="shrink-0 flex items-center gap-2 bg-accent text-accent-foreground font-bold px-6 h-12 rounded-full"
          >
            <Plus className="w-5 h-5" /> سجّل نشاطك
          </button>
        </div>
        )}
      </div>
    </section>
  );
}

import { useState, type FormEvent } from 'react';
import { Building2, Compass, Loader2, RefreshCw, Search } from 'lucide-react';
import BoatCard from '../components/BoatCard';
import Logo from '../components/Logo';
import type { Boat, BoatCategory } from '../data';
import { useAuth } from '../lib/auth';
import { categoryMeta } from '../lib/categories';
import { useRemote } from '../lib/remote';
import type { Screen } from '../lib/screens';

interface Props {
  onSearch: (q: string) => void;
  onCategory: (c: BoatCategory) => void;
  onOpen: (b: Boat) => void;
  go: (s: Screen) => void;
}

export default function Home({ onSearch, onCategory, onOpen, go }: Props) {
  const { user } = useAuth();
  const { boats, loading, error, reload } = useRemote();
  const [q, setQ] = useState('');
  const first = (user?.name ?? '').trim().split(/\s+/)[0];
  const latest = boats.slice(0, 6);

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSearch(q.trim());
  };

  return (
    <div className="px-5 pb-8">
      <header className="safe-top pt-4 flex items-center gap-3">
        <Logo className="w-11 h-11 text-primary shrink-0" />
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{first ? `أهلاً ${first}` : 'أهلاً بك'}</p>
          <h1 className="font-display font-extrabold text-xl leading-tight">مرسى</h1>
        </div>
      </header>

      <form onSubmit={submit} className="relative mt-5" role="search">
        <Search className="absolute start-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="ابحث عن قارب، محرك، ولاية…"
          aria-label="بحث"
          enterKeyHint="search"
          className="w-full py-3.5 ps-12 pe-4 rounded-2xl bg-card border border-border text-base outline-none focus:ring-2 focus:ring-primary/30"
        />
      </form>

      <section className="relative overflow-hidden rounded-3xl bg-primary text-primary-foreground p-6 mt-5">
        <svg aria-hidden="true" viewBox="0 0 400 120" preserveAspectRatio="none" className="absolute inset-x-0 bottom-0 w-full h-24 opacity-30">
          <path d="M0 60 C 60 30 120 90 200 60 S 340 30 400 60 V120 H0 Z" fill="#FF6D1B" />
        </svg>
        <div className="relative">
          <h2 className="font-display font-extrabold text-2xl leading-snug">عندك قارب للبيع؟</h2>
          <p className="text-primary-foreground/80 text-sm mt-1.5 leading-relaxed max-w-xs">
            انشر إعلانك في دقائق ليصل إلى البحّارة والمشترين في الولايات الساحلية، بدون عمولة على البيع.
          </p>
          <button type="button" onClick={() => go('sell')} className="mt-4 bg-accent text-accent-foreground font-display font-extrabold h-12 px-7 rounded-full shadow-lg">
            بِع قاربك الآن
          </button>
        </div>
      </section>

      <h2 className="font-display font-extrabold text-lg mt-8 mb-3">تصفح حسب الفئة</h2>
      <div className="grid grid-cols-3 gap-3">
        {categoryMeta.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => onCategory(c.id)}
            className="bg-card border border-border rounded-2xl py-4 px-2 flex flex-col items-center justify-center gap-2 active:scale-95 transition-transform"
          >
            <span className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <c.icon className="w-6 h-6" />
            </span>
            <span className="text-xs font-bold text-center leading-snug">{c.label}</span>
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between mt-8 mb-3">
        <h2 className="font-display font-extrabold text-lg">أحدث الإعلانات</h2>
        <button type="button" onClick={() => go('browse')} className="text-accent font-bold text-sm h-10 px-1">عرض الكل</button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center py-12 text-muted-foreground">
          <Loader2 className="w-8 h-8 animate-spin mb-3" />
          <p className="text-sm">جارٍ تحميل الإعلانات…</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center py-10 text-center">
          <p className="font-bold">{error}</p>
          <button type="button" onClick={reload} className="mt-4 flex items-center gap-2 bg-primary text-primary-foreground font-bold px-6 h-11 rounded-full">
            <RefreshCw className="w-4 h-4" /> تحديث
          </button>
        </div>
      ) : latest.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {latest.map((b) => (
            <BoatCard key={b.id} boat={b} onOpen={onOpen} />
          ))}
        </div>
      ) : (
        <div className="text-center py-10 bg-card border border-border rounded-2xl">
          <p className="font-bold">لا توجد إعلانات منشورة بعد</p>
          <p className="text-sm text-muted-foreground mt-1">كن أول من ينشر قاربه على مرسى.</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 mt-8">
        <button type="button" onClick={() => go('dalil')} className="bg-secondary rounded-2xl p-4 text-start active:scale-95 transition-transform">
          <Compass className="w-7 h-7 text-primary mb-2" />
          <div className="font-display font-extrabold">الدليل البحري</div>
          <div className="text-xs text-muted-foreground mt-0.5 leading-relaxed">موردون وميكانيك وورشات</div>
        </button>
        <button type="button" onClick={() => go('register')} className="bg-secondary rounded-2xl p-4 text-start active:scale-95 transition-transform">
          <Building2 className="w-7 h-7 text-primary mb-2" />
          <div className="font-display font-extrabold">سجّل نشاطك</div>
          <div className="text-xs text-muted-foreground mt-0.5 leading-relaxed">أضف ورشتك أو محلك للدليل</div>
        </button>
      </div>
    </div>
  );
}

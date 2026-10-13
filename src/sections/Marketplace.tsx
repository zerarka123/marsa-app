import { useMemo, useState } from 'react';
import { Loader2, RefreshCw, Ship, SearchX } from 'lucide-react';
import Reveal from '../components/Reveal';
import BoatCard from '../components/BoatCard';
import { wilayas, type Boat, type BoatCategory } from '../data';
import { useRemote } from '../lib/remote';
import { categoryMeta } from '../lib/categories';

const categories: { id: BoatCategory | 'الكل'; label: string; icon: typeof Ship }[] = [
  { id: 'الكل', label: 'الكل', icon: Ship },
  ...categoryMeta,
];

const priceRanges = [
  { id: 'all', label: 'كل الأسعار', min: 0, max: Infinity },
  { id: 'low', label: 'أقل من 2 مليون', min: 0, max: 2000000 },
  { id: 'mid', label: '2 – 5 مليون', min: 2000000, max: 5000000 },
  { id: 'high', label: 'أكثر من 5 مليون', min: 5000000, max: Infinity },
];

const sorts = [
  { id: 'new', label: 'الأحدث' },
  { id: 'low', label: 'الأرخص' },
  { id: 'high', label: 'الأغلى' },
  { id: 'year', label: 'الأحدث صنعاً' },
];

interface Props {
  query: string;
  wilaya: string;
  setWilaya: (w: string) => void;
  category: BoatCategory | 'الكل';
  setCategory: (c: BoatCategory | 'الكل') => void;
  onOpen: (b: Boat) => void;
  clearQuery: () => void;
}

export default function Marketplace({ query, wilaya, setWilaya, category, setCategory, onOpen, clearQuery }: Props) {
  const { boats, loading, error, ready, reload } = useRemote();
  const [price, setPrice] = useState('all');
  const [sort, setSort] = useState('new');
  const [condition, setCondition] = useState<'الكل' | 'جديد' | 'مستعمل'>('الكل');

  const filtered = useMemo(() => {
    const range = priceRanges.find((r) => r.id === price)!;
    const q = query.trim();
    const list = boats.filter((b) => {
      if (category !== 'الكل' && b.category !== category) return false;
      if (wilaya !== 'الكل' && b.wilaya !== wilaya) return false;
      if (condition !== 'الكل' && b.condition !== condition) return false;
      if (b.price < range.min || b.price > range.max) return false;
      if (q && !(b.title + b.engine + b.wilaya + b.category).includes(q)) return false;
      return true;
    });
    if (sort === 'low') list.sort((a, b) => a.price - b.price);
    if (sort === 'high') list.sort((a, b) => b.price - a.price);
    if (sort === 'year') list.sort((a, b) => (b.year ?? 0) - (a.year ?? 0));
    return list;
  }, [boats, category, wilaya, price, query, sort, condition]);

  const hasFilters = category !== 'الكل' || wilaya !== 'الكل' || price !== 'all' || condition !== 'الكل' || query.trim() !== '';
  const reset = () => {
    setCategory('الكل');
    setWilaya('الكل');
    setPrice('all');
    setCondition('الكل');
    setSort('new');
    clearQuery();
  };

  const selectCls = 'bg-card border border-border rounded-xl px-3 h-11 text-sm font-medium outline-none';

  return (
    <section id="acheter" className="py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-5 md:px-8">
        <Reveal>
          <div className="flex items-baseline gap-4 mb-2">
            <span className="font-display font-extrabold text-accent text-sm">01</span>
            <h2 className="font-display font-extrabold text-3xl md:text-5xl">قوارب للبيع</h2>
          </div>
          <p className="text-muted-foreground max-w-xl leading-relaxed">
            من قوارب الصيد التقليدية إلى اليخوت — كل إعلان بمواصفات واضحة وبائع يمكنك الاتصال به مباشرة.
          </p>
        </Reveal>

        <div className="flex gap-2 overflow-x-auto pb-2 mt-8 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {categories.map((c) => (
            <button
              type="button"
              key={c.id}
              onClick={() => setCategory(c.id)}
              className={`flex items-center gap-2 shrink-0 px-4 h-11 rounded-full text-sm font-bold border-2 transition-all ${
                category === c.id
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-border text-muted-foreground hover:border-primary hover:text-primary'
              }`}
            >
              <c.icon className="w-4 h-4" />
              {c.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2 mt-4">
          <select aria-label="الولاية" value={wilaya} onChange={(e) => setWilaya(e.target.value)} className={selectCls}>
            {wilayas.map((w) => (
              <option key={w} value={w}>{w === 'الكل' ? 'كل الولايات' : w}</option>
            ))}
          </select>
          <select aria-label="السعر" value={price} onChange={(e) => setPrice(e.target.value)} className={selectCls}>
            {priceRanges.map((r) => (
              <option key={r.id} value={r.id}>{r.label}</option>
            ))}
          </select>
          <select aria-label="الحالة" value={condition} onChange={(e) => setCondition(e.target.value as typeof condition)} className={selectCls}>
            <option value="الكل">جديد ومستعمل</option>
            <option value="جديد">جديد</option>
            <option value="مستعمل">مستعمل</option>
          </select>
          <select aria-label="الترتيب" value={sort} onChange={(e) => setSort(e.target.value)} className={selectCls}>
            {sorts.map((s) => (
              <option key={s.id} value={s.id}>ترتيب: {s.label}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center justify-between mt-5 text-sm">
          <span className="font-bold">{filtered.length} إعلان</span>
          {hasFilters && (
            <button type="button" onClick={reset} className="text-accent font-bold h-11 px-2">مسح الفلاتر</button>
          )}
        </div>

        {loading ? (
          <div className="flex flex-col items-center py-16 text-center text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin mb-3" />
            <p className="text-sm">جارٍ تحميل الإعلانات…</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center py-16 text-center">
            <p className="font-display font-bold text-lg">{error}</p>
            <button type="button" onClick={reload} className="mt-4 flex items-center gap-2 bg-primary text-primary-foreground font-bold px-6 h-11 rounded-full">
              <RefreshCw className="w-4 h-4" /> تحديث
            </button>
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-2">
            {filtered.map((b, i) => (
              <Reveal key={b.id} delay={Math.min(i, 5) * 0.08}>
                <BoatCard boat={b} onOpen={onOpen} />
              </Reveal>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center py-16 text-center">
            <SearchX className="w-10 h-10 text-muted-foreground mb-3" />
            <p className="font-display font-bold text-lg">
              {boats.length === 0 ? 'لا توجد إعلانات منشورة بعد' : 'لا توجد نتائج مطابقة'}
            </p>
            <p className="text-muted-foreground text-sm mt-1">
              {boats.length === 0
                ? ready
                  ? 'كن أول من ينشر إعلاناً — افتح حسابك مجانا وانشر قاربك.'
                  : 'الخدمة قيد التفعيل وستظهر الإعلانات هنا قريباً.'
                : 'جرّب توسيع الفلاتر أو البحث بكلمة أخرى'}
            </p>
            {boats.length > 0 ? (
              <button type="button" onClick={reset} className="mt-4 bg-primary text-primary-foreground font-bold px-6 h-11 rounded-full">
                عرض كل الإعلانات
              </button>
            ) : (
              <button
                type="button"
                onClick={() => document.getElementById('vendre')?.scrollIntoView({ behavior: 'smooth' })}
                className="mt-4 bg-accent text-accent-foreground font-bold px-6 h-11 rounded-full"
              >
                انشر إعلانك
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

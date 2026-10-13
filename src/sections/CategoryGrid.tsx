import Reveal from '../components/Reveal';
import type { BoatCategory } from '../data';
import { useRemote } from '../lib/remote';
import { categoryMeta } from '../lib/categories';

interface Props {
  onPick: (c: BoatCategory) => void;
}

export default function CategoryGrid({ onPick }: Props) {
  const { boats } = useRemote();
  return (
    <section id="categories" className="pt-14 pb-2">
      <div className="max-w-7xl mx-auto px-5 md:px-8">
        <Reveal>
          <h2 className="font-display font-extrabold text-2xl md:text-3xl mb-5">ماذا تبحث عنه؟</h2>
        </Reveal>
        <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-3">
          {categoryMeta.map((c) => {
            const n = boats.filter((b) => b.category === c.id).length;
            return (
              <button
                type="button"
                key={c.id}
                onClick={() => {
                  onPick(c.id);
                  document.getElementById('acheter')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="flex flex-col items-center justify-center gap-2 bg-card border border-border rounded-2xl py-4 px-2 min-h-[104px] transition-colors hover:border-primary active:scale-95"
              >
                <c.icon className="w-8 h-8 text-primary" strokeWidth={1.8} />
                <span className="text-sm font-bold text-center leading-tight">{c.label}</span>
                <span className="text-xs text-muted-foreground">{n} إعلان</span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

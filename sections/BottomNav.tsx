import { Compass, Home, Plus, Search, Star } from 'lucide-react';
import { useFavorites } from '../lib/favorites';
import { goTo } from '../lib/nav';

interface Props {
  onFavorites: () => void;
}

const item = 'flex flex-col items-center justify-center gap-0.5 flex-1 h-full text-xs font-bold text-muted-foreground active:text-primary';

export default function BottomNav({ onFavorites }: Props) {
  const fav = useFavorites();
  return (
    <nav aria-label="التنقل الرئيسي" className="safe-bottom md:hidden fixed bottom-0 inset-x-0 z-40 bg-card border-t border-border">
      <div className="h-16 flex items-center">
        <button type="button" onClick={() => goTo('')} className={item}><Home className="w-6 h-6" />الرئيسية</button>
        <button type="button" onClick={() => goTo('categories')} className={item}><Search className="w-6 h-6" />تصفح</button>
        <button
          type="button"
          onClick={() => goTo('sell-form', 88)}
          className="flex-1 flex justify-center -mt-6"
          aria-label="أضف إعلانك"
        >
          <span className="w-14 h-14 rounded-full bg-accent text-accent-foreground flex items-center justify-center shadow-lg">
            <Plus className="w-7 h-7" />
          </span>
        </button>
        <button type="button" onClick={() => goTo('dalil')} className={item}><Compass className="w-6 h-6" />الدليل</button>
        <button type="button" onClick={onFavorites} className={`${item} relative`}>
          <Star className="w-6 h-6" />
          المفضلة
          {fav.ids.length > 0 && (
            <span className="absolute top-1.5 end-[28%] bg-accent text-accent-foreground rounded-full text-[10px] min-w-4 h-4 px-1 flex items-center justify-center">
              {fav.ids.length}
            </span>
          )}
        </button>
      </div>
    </nav>
  );
}

import { Home, Plus, Search, Star, User } from 'lucide-react';
import { useFavorites } from '../lib/favorites';
import type { Tab } from '../lib/screens';

interface Props {
  tab: Tab | null; // null عندما تكون صفحة فرعية مفتوحة
  onTab: (t: Tab) => void;
}

const item = (active: boolean) =>
  `relative flex flex-col items-center justify-center gap-0.5 flex-1 h-full text-[11px] font-bold transition-colors ${active ? 'text-primary' : 'text-muted-foreground'}`;

export default function TabBar({ tab, onTab }: Props) {
  const fav = useFavorites();
  const bar = (active: boolean) => active && <span className="absolute top-0 w-8 h-1 rounded-b-full bg-accent" />;
  return (
    <nav aria-label="التنقل الرئيسي" className="safe-bottom fixed bottom-0 inset-x-0 z-40 bg-card/95 backdrop-blur border-t border-border">
      <div className="h-16 flex items-center max-w-5xl mx-auto">
        <button type="button" onClick={() => onTab('home')} className={item(tab === 'home')}>
          {bar(tab === 'home')}
          <Home className="w-6 h-6" />
          الرئيسية
        </button>
        <button type="button" onClick={() => onTab('browse')} className={item(tab === 'browse')}>
          {bar(tab === 'browse')}
          <Search className="w-6 h-6" />
          تصفح
        </button>
        <button type="button" onClick={() => onTab('sell')} className="flex-1 flex flex-col items-center -mt-6" aria-label="بِع قاربك">
          <span className="w-14 h-14 rounded-full bg-accent text-accent-foreground flex items-center justify-center shadow-lg ring-4 ring-card">
            <Plus className="w-7 h-7" />
          </span>
          <span className={`text-[11px] font-bold mt-0.5 ${tab === 'sell' ? 'text-primary' : 'text-muted-foreground'}`}>بِع</span>
        </button>
        <button type="button" onClick={() => onTab('favs')} className={item(tab === 'favs')}>
          {bar(tab === 'favs')}
          <Star className="w-6 h-6" />
          المفضلة
          {fav.ids.length > 0 && (
            <span className="absolute top-1.5 end-[26%] bg-accent text-accent-foreground rounded-full text-[10px] min-w-4 h-4 px-1 flex items-center justify-center">
              {fav.ids.length}
            </span>
          )}
        </button>
        <button type="button" onClick={() => onTab('account')} className={item(tab === 'account')}>
          {bar(tab === 'account')}
          <User className="w-6 h-6" />
          حسابي
        </button>
      </div>
    </nav>
  );
}

import { Star } from 'lucide-react';
import BoatCard from '../components/BoatCard';
import Page from '../components/Page';
import type { Boat } from '../data';
import { useFavorites } from '../lib/favorites';
import { useRemote } from '../lib/remote';

export default function Favorites({ onOpen, onBrowse }: { onOpen: (b: Boat) => void; onBrowse: () => void }) {
  const fav = useFavorites();
  const { boats } = useRemote();
  const list = boats.filter((b) => fav.ids.includes(b.id));

  return (
    <Page title={`المفضلة (${list.length})`}>
      <div className="px-5 py-5">
        {list.length === 0 ? (
          <div className="text-center py-16">
            <Star className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="font-bold">لم تحفظ أي إعلان بعد</p>
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">اضغط على النجمة في أي قارب لتجده هنا لاحقاً.</p>
            <button type="button" onClick={onBrowse} className="mt-5 bg-primary text-primary-foreground font-bold px-8 h-12 rounded-full">تصفح الإعلانات</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {list.map((b) => (
              <BoatCard key={b.id} boat={b} onOpen={onOpen} />
            ))}
          </div>
        )}
      </div>
    </Page>
  );
}

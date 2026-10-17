import { useEffect, useState } from 'react';
import { Loader2, Ship, Trash2 } from 'lucide-react';
import Page from '../components/Page';
import { fmtPrice, type Boat } from '../data';
import { deleteListing, errorMessage, fetchRows } from '../lib/api';
import { useAuth } from '../lib/auth';
import { LISTING_COLS, mapBoat, useRemote } from '../lib/remote';

type Row = Record<string, unknown>;
interface Item {
  boat: Boat;
  status: string;
}

const STATUS: Record<string, { label: string; cls: string }> = {
  approved: { label: 'منشور', cls: 'bg-primary/10 text-primary' },
  pending: { label: 'قيد المراجعة', cls: 'bg-accent/15 text-accent' },
  rejected: { label: 'مرفوض', cls: 'bg-destructive/10 text-destructive' },
};

interface Props {
  onBack: () => void;
  onOpen: (b: Boat) => void;
  onSell: () => void;
}

export default function MyListings({ onBack, onOpen, onSell }: Props) {
  const { user } = useAuth();
  const { reload } = useRemote();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  const userId = user?.id ?? '';
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    fetchRows<Row>('listings', `select=${LISTING_COLS},status&user_id=eq.${encodeURIComponent(userId)}&order=created_at.desc&limit=100`, true)
      .then((rows) => {
        if (cancelled) return;
        const list: Item[] = [];
        rows.forEach((r) => {
          const boat = mapBoat(r);
          if (boat) list.push({ boat, status: typeof r.status === 'string' ? r.status : 'pending' });
        });
        setItems(list);
      })
      .catch((e) => { if (!cancelled) setError(errorMessage(e)); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [userId]);

  const remove = async (b: Boat) => {
    setBusyId(b.id);
    setError('');
    try {
      await deleteListing(b.id, b.images);
      setItems((prev) => prev.filter((it) => it.boat.id !== b.id));
      setConfirmId(null);
      reload();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Page title="إعلاناتي" onBack={onBack}>
      <div className="px-5 py-5">
        {error && <p role="alert" className="text-sm text-destructive font-bold mb-3">{error}</p>}
        {loading ? (
          <div className="flex flex-col items-center py-16 text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin mb-3" />
            <p className="text-sm">جارٍ التحميل…</p>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-16">
            <Ship className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="font-bold">لم تنشر أي إعلان بعد</p>
            <button type="button" onClick={onSell} className="mt-5 bg-accent text-accent-foreground font-bold px-8 h-12 rounded-full">انشر إعلانك الأول</button>
          </div>
        ) : (
          <ul className="space-y-3">
            {items.map(({ boat, status }) => {
              const st = STATUS[status] ?? STATUS.pending;
              return (
                <li key={boat.id} className="bg-card border border-border rounded-2xl p-3">
                  <div className="flex items-center gap-3">
                    <button type="button" onClick={() => onOpen(boat)} className="flex items-center gap-3 flex-1 min-w-0 text-start">
                      {boat.images[0] ? (
                        <img src={boat.images[0]} alt="" className="w-16 h-16 rounded-xl object-cover shrink-0" />
                      ) : (
                        <span className="w-16 h-16 rounded-xl bg-secondary flex items-center justify-center shrink-0 text-muted-foreground"><Ship className="w-6 h-6" /></span>
                      )}
                      <span className="min-w-0">
                        <span className="block font-bold text-sm line-clamp-1">{boat.title}</span>
                        <span className="block text-primary font-extrabold text-sm">{fmtPrice(boat.price)}</span>
                        <span className={`inline-block mt-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${st.cls}`}>{st.label}</span>
                      </span>
                    </button>
                    <button type="button" aria-label="حذف الإعلان" onClick={() => setConfirmId(boat.id)} className="w-11 h-11 flex items-center justify-center text-destructive shrink-0">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                  {confirmId === boat.id && (
                    <div className="mt-3 pt-3 border-t border-border">
                      <p className="text-sm font-bold">حذف هذا الإعلان نهائياً؟</p>
                      <div className="flex gap-2 mt-2">
                        <button type="button" disabled={busyId === boat.id} onClick={() => remove(boat)} className="flex-1 h-11 rounded-full bg-destructive text-destructive-foreground font-bold disabled:opacity-60">
                          {busyId === boat.id ? 'جارٍ الحذف…' : 'نعم، احذف'}
                        </button>
                        <button type="button" disabled={busyId === boat.id} onClick={() => setConfirmId(null)} className="flex-1 h-11 rounded-full bg-secondary font-bold">إلغاء</button>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </Page>
  );
}

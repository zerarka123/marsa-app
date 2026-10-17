import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { businessKinds, type Boat, type BoatCategory, type Business, type BusinessKind, type Condition, type FuelType } from '../data';
import { backendReady, fetchRows } from './api';
import { normalizePhone, postedLabel, safeImageUrl } from './format';

type Row = Record<string, unknown>;
const str = (v: unknown, max = 2000): string => (typeof v === 'string' ? v.slice(0, max) : '');
const numOrNull = (v: unknown): number | null => {
  const n = typeof v === 'number' ? v : typeof v === 'string' && v !== '' ? Number(v) : NaN;
  return Number.isFinite(n) ? n : null;
};

export const LISTING_COLS =
  'id,user_id,title,category,wilaya,price,year,length_m,condition,negotiable,engine,fuel,description,seller_name,seller_phone,seller_kind,images,created_at';
const BUSINESS_COLS = 'id,name,kind,wilaya,address,phone,specialties,hours,verified';

export function mapBoat(r: Row): Boat | null {
  const id = numOrNull(r.id);
  const price = numOrNull(r.price);
  if (id === null || price === null) return null;
  const images = (Array.isArray(r.images) ? r.images : []).map((u) => safeImageUrl(str(u, 500))).filter(Boolean);
  const fuel = str(r.fuel);
  return {
    id,
    title: str(r.title, 120),
    category: str(r.category, 20) as BoatCategory,
    wilaya: str(r.wilaya, 40),
    price,
    year: numOrNull(r.year),
    length: numOrNull(r.length_m),
    negotiable: r.negotiable === true,
    engine: str(r.engine, 120),
    fuel: (fuel === 'بنزين' || fuel === 'مازوت' ? fuel : '—') as FuelType,
    condition: (str(r.condition) === 'جديد' ? 'جديد' : 'مستعمل') as Condition,
    images,
    description: str(r.description, 2000),
    seller: {
      name: str(r.seller_name, 80),
      kind: str(r.seller_kind) === 'وكالة' ? 'وكالة' : 'فرد',
      phone: normalizePhone(str(r.seller_phone, 30)),
      wilaya: str(r.wilaya, 40),
    },
    postedAt: postedLabel(str(r.created_at, 40)),
    userId: str(r.user_id, 64) || undefined,
  };
}

function mapBusiness(r: Row): Business | null {
  const id = numOrNull(r.id);
  const kind = str(r.kind) as BusinessKind;
  if (id === null || !businessKinds.includes(kind)) return null;
  return {
    id,
    name: str(r.name, 120),
    kind,
    wilaya: str(r.wilaya, 40),
    address: str(r.address, 200),
    phone: normalizePhone(str(r.phone, 30)),
    specialties: (Array.isArray(r.specialties) ? r.specialties : []).map((s) => str(s, 40)).filter(Boolean).slice(0, 12),
    hours: str(r.hours, 100),
    verified: r.verified === true,
  };
}

interface RemoteCtx {
  boats: Boat[];
  businesses: Business[];
  loading: boolean;
  error: string;
  ready: boolean;
  reload: () => void;
}

const Ctx = createContext<RemoteCtx>({ boats: [], businesses: [], loading: false, error: '', ready: false, reload: () => {} });

export function RemoteProvider({ children }: { children: ReactNode }) {
  const [boats, setBoats] = useState<Boat[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(backendReady());
  const [error, setError] = useState('');
  const [tick, setTick] = useState(0);

  const reload = useCallback(() => setTick((n) => n + 1), []);

  useEffect(() => {
    if (!backendReady()) return;
    let cancelled = false;
    setLoading(true);
    setError('');
    Promise.all([
      fetchRows<Row>('listings', `select=${LISTING_COLS}&status=eq.approved&order=created_at.desc&limit=300`),
      fetchRows<Row>('businesses', `select=${BUSINESS_COLS}&status=eq.approved&order=created_at.desc&limit=300`),
    ])
      .then(([l, b]) => {
        if (cancelled) return;
        setBoats(l.map(mapBoat).filter((x): x is Boat => x !== null));
        setBusinesses(b.map(mapBusiness).filter((x): x is Business => x !== null));
      })
      .catch(() => {
        if (!cancelled) setError('تعذّر تحميل الإعلانات. تحقق من الإنترنت ثم اضغط «تحديث».');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [tick]);

  const value = useMemo<RemoteCtx>(
    () => ({ boats, businesses, loading, error, ready: backendReady(), reload }),
    [boats, businesses, loading, error, reload],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useRemote = () => useContext(Ctx);

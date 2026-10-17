import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

interface FavCtx {
  ids: number[];
  has: (id: number) => boolean;
  toggle: (id: number) => void;
}

const Ctx = createContext<FavCtx>({ ids: [], has: () => false, toggle: () => {} });
const KEY = 'marsa-favorites';

function load(): number[] {
  try {
    const raw: unknown = JSON.parse(localStorage.getItem(KEY) ?? '[]');
    return Array.isArray(raw) ? raw.filter((x): x is number => typeof x === 'number' && Number.isFinite(x)).slice(0, 500) : [];
  } catch {
    return [];
  }
}

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [ids, setIds] = useState<number[]>(load);

  const toggle = useCallback((id: number) => {
    setIds((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      try {
        localStorage.setItem(KEY, JSON.stringify(next));
      } catch {
        /* التخزين غير متاح */
      }
      return next;
    });
  }, []);

  const value = useMemo<FavCtx>(() => ({ ids, has: (id) => ids.includes(id), toggle }), [ids, toggle]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useFavorites = () => useContext(Ctx);

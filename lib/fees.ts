import { useEffect, useState } from 'react';
import { fetchRows } from './api';

export interface Fees {
  listing: number; // رسوم نشر إعلان (دج)
  business: number; // اشتراك الدليل السنوي (دج)
}

// الصفر = لا رسوم (أو لم يُشغَّل ملف supabase/fees.sql بعد). المرجع النهائي دائماً هو الخادم.
const NONE: Fees = { listing: 0, business: 0 };
let cache: Promise<Fees> | null = null;

export function loadFees(): Promise<Fees> {
  if (!cache) {
    cache = fetchRows<Record<string, unknown>>('payment_settings', 'select=key,value&key=in.(listing_fee,business_fee)')
      .then((rows) => {
        const out: Fees = { ...NONE };
        rows.forEach((r) => {
          const n = Number(r.value);
          if (!Number.isFinite(n) || n < 0) return;
          if (r.key === 'listing_fee') out.listing = n;
          else if (r.key === 'business_fee') out.business = n;
        });
        return out;
      })
      .catch(() => {
        cache = null;
        return NONE;
      });
  }
  return cache;
}

export function useFees(): Fees {
  const [fees, setFees] = useState<Fees>(NONE);
  useEffect(() => {
    let cancelled = false;
    void loadFees().then((f) => {
      if (!cancelled) setFees(f);
    });
    return () => {
      cancelled = true;
    };
  }, []);
  return fees;
}

import { useCallback, useEffect, useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, ExternalLink, Loader2, RefreshCw, Wallet } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { SHOW_TOPUP_NOTICE, WALLET_URL } from '../config';
import { fmtPrice } from '../data';
import { fetchBalance, fetchWalletActivity, type AuthUser, type TopupReq, type WalletTx } from '../lib/api';
import { postedLabel } from '../lib/format';

interface Props {
  open: boolean;
  user: AuthUser | null;
  onClose: () => void;
  onSignIn: () => void;
}

const TX_LABEL: Record<string, string> = { topup: 'شحن رصيد', spend: 'خصم', adjust: 'تعديل من الإدارة' };
const STATUS_LABEL: Record<string, string> = { pending: 'قيد المراجعة', approved: 'تم الشحن', rejected: 'مرفوض', failed: 'فشل' };
const STATUS_TONE: Record<string, string> = {
  pending: 'bg-accent/15 text-foreground',
  approved: 'bg-primary/10 text-primary',
  rejected: 'bg-destructive/10 text-destructive',
  failed: 'bg-destructive/10 text-destructive',
};
const METHOD_LABEL: Record<string, string> = { baridimob: 'بريدي موب', ccp: 'CCP', cib: 'CIB', edahabia: 'الذهبية' };

export default function WalletDialog({ open, user, onClose, onSignIn }: Props) {
  const userId = user?.id ?? '';
  const [balance, setBalance] = useState<number | null>(null);
  const [txs, setTxs] = useState<WalletTx[]>([]);
  const [topups, setTopups] = useState<TopupReq[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tick, setTick] = useState(0);

  const refresh = useCallback(() => setTick((n) => n + 1), []);

  useEffect(() => {
    if (!open || !userId) return;
    let cancelled = false;
    setLoading(true);
    setError('');
    Promise.all([fetchBalance(), fetchWalletActivity()])
      .then(([b, a]) => {
        if (cancelled) return;
        setBalance(b);
        setTxs(a.txs);
        setTopups(a.topups);
      })
      .catch(() => {
        if (!cancelled) setError('تعذّر تحميل بيانات المحفظة. تحقق من الإنترنت ثم اضغط «تحديث».');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, userId, tick]);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md max-h-[92vh] overflow-y-auto" dir="rtl">
        <DialogTitle className="font-display font-extrabold text-xl flex items-center gap-2">
          <Wallet className="w-5 h-5" /> محفظتي
        </DialogTitle>
        <DialogDescription className="sr-only">رصيد حسابك وآخر العمليات وطلبات الشحن</DialogDescription>

        {!user ? (
          <div className="text-center py-6 space-y-3">
            <p className="text-sm text-muted-foreground leading-relaxed">سجّل الدخول لعرض رصيدك وعملياتك.</p>
            <button type="button" onClick={onSignIn} className="bg-primary text-primary-foreground font-bold px-8 h-11 rounded-full">
              تسجيل الدخول
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-primary text-primary-foreground rounded-2xl p-5">
              <div className="text-xs text-primary-foreground/70">الرصيد الحالي</div>
              <div className="font-display font-extrabold text-3xl mt-1">
                {balance === null ? (loading ? '…' : '—') : fmtPrice(balance)}
              </div>
            </div>

            {SHOW_TOPUP_NOTICE && (
              <a
                href={WALLET_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 bg-accent text-accent-foreground font-display font-extrabold h-12 rounded-xl"
              >
                <ExternalLink className="w-4 h-4" /> شحن الرصيد (موقع المحفظة)
              </a>
            )}

            {error && <p role="alert" className="text-sm text-destructive font-bold">{error}</p>}

            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-display font-bold">آخر العمليات</h3>
                <button
                  type="button"
                  onClick={refresh}
                  disabled={loading}
                  aria-label="تحديث"
                  className="w-11 h-11 -m-2 flex items-center justify-center text-muted-foreground disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                </button>
              </div>
              {txs.length === 0 ? (
                <p className="text-sm text-muted-foreground bg-secondary rounded-xl p-4">لا توجد عمليات بعد.</p>
              ) : (
                <ul className="divide-y divide-border border border-border rounded-xl overflow-hidden">
                  {txs.map((t) => (
                    <li key={t.id} className="flex items-center gap-3 p-3 bg-card">
                      <span className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${t.amount >= 0 ? 'bg-primary/10 text-primary' : 'bg-destructive/10 text-destructive'}`}>
                        {t.amount >= 0 ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-bold">{TX_LABEL[t.kind] ?? 'عملية'}</div>
                        <div className="text-xs text-muted-foreground truncate">{t.note || postedLabel(t.createdAt)}</div>
                      </div>
                      <span dir="ltr" className="text-sm font-bold shrink-0">
                        {t.amount > 0 ? '+' : ''}{fmtPrice(t.amount)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {topups.length > 0 && (
              <div>
                <h3 className="font-display font-bold mb-2">طلبات الشحن</h3>
                <ul className="space-y-2">
                  {topups.map((t) => (
                    <li key={t.id} className="flex items-center gap-3 border border-border rounded-xl p-3 bg-card">
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-bold">{fmtPrice(t.amount)}</div>
                        <div className="text-xs text-muted-foreground">{METHOD_LABEL[t.method] ?? t.method} · {postedLabel(t.createdAt)}</div>
                      </div>
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${STATUS_TONE[t.status] ?? 'bg-secondary'}`}>
                        {STATUS_LABEL[t.status] ?? t.status}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

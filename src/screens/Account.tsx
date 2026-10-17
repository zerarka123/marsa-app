import { useEffect, useState, type ReactNode } from 'react';
import { ChevronLeft, Compass, FileText, Flag, ListChecks, LogOut, Settings, ShieldCheck, Wallet, Building2 } from 'lucide-react';
import Page from '../components/Page';
import { APP, SHOW_TOPUP_NOTICE } from '../config';
import { fmtPrice } from '../data';
import { fetchBalance, signOut } from '../lib/api';
import { useAuth } from '../lib/auth';
import type { Screen } from '../lib/screens';
import { useUi } from '../lib/ui';

function Row({ icon, label, onClick, danger }: { icon: ReactNode; label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button type="button" onClick={onClick} className={`w-full flex items-center gap-3 px-4 h-14 text-start active:bg-secondary ${danger ? 'text-destructive' : ''}`}>
      <span className="w-6 h-6 flex items-center justify-center shrink-0">{icon}</span>
      <span className="flex-1 font-bold text-sm">{label}</span>
      {!danger && <ChevronLeft className="w-5 h-5 text-muted-foreground" />}
    </button>
  );
}

export default function Account({ go }: { go: (s: Screen) => void }) {
  const { user, openAuth, openWallet } = useAuth();
  const { openLegal, openReport } = useUi();
  const [balance, setBalance] = useState<number | null>(null);

  const userId = user?.id ?? '';
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    fetchBalance()
      .then((b) => { if (!cancelled) setBalance(b); })
      .catch(() => { if (!cancelled) setBalance(null); });
    return () => { cancelled = true; };
  }, [userId]);

  if (!user) return null;
  const icon = 'w-5 h-5 text-primary';

  return (
    <Page title="حسابي">
      <div className="px-5 py-5 space-y-4">
        <div className="flex items-center gap-4 bg-card border border-border rounded-3xl p-4">
          <div className="w-14 h-14 rounded-full bg-primary text-primary-foreground font-display font-extrabold flex items-center justify-center text-xl shrink-0">
            {(user.name || user.email).charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="font-display font-extrabold truncate">{user.name || 'مستخدم مرسى'}</div>
            <div className="text-xs text-muted-foreground truncate" dir="ltr">{user.email}</div>
          </div>
        </div>

        <div className="bg-primary text-primary-foreground rounded-3xl p-5">
          <div className="text-xs text-primary-foreground/70">رصيد حسابك</div>
          <div className="font-display font-extrabold text-3xl mt-1">{balance === null ? '—' : fmtPrice(balance)}</div>
          {SHOW_TOPUP_NOTICE && <p className="text-xs text-primary-foreground/70 mt-2 leading-relaxed">يمكنك شحن رصيدك عبر موقعنا الإلكتروني.</p>}
          <button type="button" onClick={openWallet} className="mt-3 flex items-center gap-2 bg-accent text-accent-foreground font-bold px-5 h-11 rounded-full">
            <Wallet className="w-4 h-4" /> محفظتي
          </button>
        </div>

        <div className="bg-card border border-border rounded-3xl divide-y divide-border overflow-hidden">
          <Row icon={<ListChecks className={icon} />} label="إعلاناتي" onClick={() => go('mine')} />
          <Row icon={<Compass className={icon} />} label="الدليل البحري" onClick={() => go('dalil')} />
          <Row icon={<Building2 className={icon} />} label="سجّل نشاطك في الدليل" onClick={() => go('register')} />
        </div>

        <div className="bg-card border border-border rounded-3xl divide-y divide-border overflow-hidden">
          <Row icon={<Settings className={icon} />} label="إدارة الحساب وحذفه" onClick={() => openAuth('signin')} />
          <Row icon={<FileText className={icon} />} label="شروط الاستخدام" onClick={() => openLegal('terms')} />
          <Row icon={<ShieldCheck className={icon} />} label="سياسة الخصوصية" onClick={() => openLegal('privacy')} />
          <Row icon={<Flag className={icon} />} label="إبلاغ عن مشكلة" onClick={() => openReport()} />
        </div>

        <div className="bg-card border border-border rounded-3xl overflow-hidden">
          <Row icon={<LogOut className="w-5 h-5" />} label="تسجيل الخروج" onClick={() => { void signOut(); }} danger />
        </div>

        <p className="text-center text-xs text-muted-foreground pt-2">{APP.name} · الإصدار {APP.version}</p>
      </div>
    </Page>
  );
}

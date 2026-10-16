import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import AuthDialog from '../components/AuthDialog';
import WalletDialog from '../components/WalletDialog';
import { getCurrentUser, onAuthChange, type AuthUser } from './api';

export type AuthMode = 'signup' | 'signin';

interface AuthCtx {
  user: AuthUser | null;
  openAuth: (mode?: AuthMode) => void;
  openWallet: () => void;
}

const Ctx = createContext<AuthCtx>({ user: null, openAuth: () => {}, openWallet: () => {} });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(getCurrentUser);
  const [dialog, setDialog] = useState<{ open: boolean; mode: AuthMode }>({ open: false, mode: 'signup' });
  const [walletOpen, setWalletOpen] = useState(false);

  useEffect(() => onAuthChange(() => setUser(getCurrentUser())), []);

  const openAuth = useCallback((mode: AuthMode = 'signup') => setDialog({ open: true, mode }), []);
  const openWallet = useCallback(() => setWalletOpen(true), []);
  const value = useMemo(() => ({ user, openAuth, openWallet }), [user, openAuth, openWallet]);

  return (
    <Ctx.Provider value={value}>
      {children}
      <AuthDialog open={dialog.open} initialMode={dialog.mode} onClose={() => setDialog((d) => ({ ...d, open: false }))} />
      <WalletDialog
        open={walletOpen}
        user={user}
        onClose={() => setWalletOpen(false)}
        onSignIn={() => {
          setWalletOpen(false);
          window.setTimeout(() => openAuth('signin'), 150);
        }}
      />
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);

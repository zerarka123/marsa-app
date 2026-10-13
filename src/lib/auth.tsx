import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import AuthDialog from '../components/AuthDialog';
import { getCurrentUser, onAuthChange, type AuthUser } from './api';

export type AuthMode = 'signup' | 'signin';

interface AuthCtx {
  user: AuthUser | null;
  openAuth: (mode?: AuthMode) => void;
}

const Ctx = createContext<AuthCtx>({ user: null, openAuth: () => {} });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(getCurrentUser);
  const [dialog, setDialog] = useState<{ open: boolean; mode: AuthMode }>({ open: false, mode: 'signup' });

  useEffect(() => onAuthChange(() => setUser(getCurrentUser())), []);

  const openAuth = useCallback((mode: AuthMode = 'signup') => setDialog({ open: true, mode }), []);
  const value = useMemo(() => ({ user, openAuth }), [user, openAuth]);

  return (
    <Ctx.Provider value={value}>
      {children}
      <AuthDialog open={dialog.open} initialMode={dialog.mode} onClose={() => setDialog((d) => ({ ...d, open: false }))} />
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);

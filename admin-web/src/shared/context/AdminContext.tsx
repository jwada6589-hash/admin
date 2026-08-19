import { createContext, useContext, useMemo, useState } from 'react';
import { useAction, useMutation, useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';

type AdminContextValue = {
  tokenHash: string;
  isLoading: boolean;
  admin: any;
  login: (password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AdminContext = createContext<AdminContextValue | null>(null);
const STORAGE_KEY = 'al_murtada_admin_session';

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [tokenHash, setTokenHash] = useState(() => {
    try { const session = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '{}'); return session.expiresAt > Date.now() ? (session.tokenHash || '') : ''; }
    catch { return ''; }
  });
  const loginAction = useAction(api.authActions.adminLogin);
  const logoutMutation = useMutation(api.adminAuth.logout);
  const admin = useQuery(api.adminAuth.me, tokenHash ? { adminTokenHash: tokenHash } : 'skip');

  const value = useMemo<AdminContextValue>(() => ({
    tokenHash,
    isLoading: Boolean(tokenHash) && admin === undefined,
    admin: tokenHash ? admin : null,
    login: async (password) => {
      const session = await loginAction({ password });
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
      setTokenHash(session.tokenHash);
    },
    logout: async () => {
      if (tokenHash) await logoutMutation({ adminTokenHash: tokenHash }).catch(() => undefined);
      sessionStorage.removeItem(STORAGE_KEY);
      setTokenHash('');
    },
  }), [admin, loginAction, logoutMutation, tokenHash]);

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (!context) throw new Error('useAdmin must be used inside AdminProvider');
  return context;
}

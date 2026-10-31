'use client';
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { api } from './api';
import type { Counts, User } from './types';
import { useToast } from './useToast';
import { Toasts } from '@/components/ui/Toasts';

interface Ctx { user: User; counts: Counts; refreshCounts: () => void; toast: (t: string, k?: 'ok' | 'error') => void; logout: () => void }
const SessionCtx = createContext<Ctx | null>(null);
export const useSession = () => useContext(SessionCtx)!;

export function SessionProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { toasts, push } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [counts, setCounts] = useState<Counts>({ scheduled: 0, sent: 0 });
  const refreshCounts = useCallback(() => { api.counts().then(setCounts).catch(() => {}); }, []);

  useEffect(() => { api.me().then(setUser).catch(() => router.replace('/')); }, [router]);
  useEffect(() => { if (!user) return; refreshCounts(); const t = setInterval(refreshCounts, 5000); return () => clearInterval(t); }, [user, refreshCounts]);
  useEffect(() => {
    const s = new URLSearchParams(window.location.search).get('slack');
    if (s === 'connected') push('Slack connected.'); else if (s === 'error') push('Slack connection failed.', 'error');
  }, [push]);

  const logout = async () => { await api.logout(); router.replace('/'); };
  if (!user) return null;
  return <SessionCtx.Provider value={{ user, counts, refreshCounts, toast: push, logout }}>{children}<Toasts toasts={toasts} /></SessionCtx.Provider>;
}

'use client';
import { useCallback, useState } from 'react';
export interface ToastMsg { id: number; text: string; kind: 'ok' | 'error' }
export function useToast() {
  const [toasts, set] = useState<ToastMsg[]>([]);
  const push = useCallback((text: string, kind: ToastMsg['kind'] = 'ok') => {
    const id = Date.now() + Math.random();
    set((t) => [...t, { id, text, kind }]);
    setTimeout(() => set((t) => t.filter((x) => x.id !== id)), 4000);
  }, []);
  return { toasts, push };
}

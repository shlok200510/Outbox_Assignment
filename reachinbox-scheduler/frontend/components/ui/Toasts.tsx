import type { ToastMsg } from '@/lib/useToast';
export function Toasts({ toasts }: { toasts: ToastMsg[] }) {
  return <div className="fixed bottom-4 right-4 z-50 space-y-2" aria-live="polite">
    {toasts.map((t) => <div key={t.id} className={`rounded-lg px-4 py-2 text-sm text-white shadow ${t.kind === 'ok' ? 'bg-brand' : 'bg-red-600'}`}>{t.text}</div>)}
  </div>;
}

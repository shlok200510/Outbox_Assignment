'use client';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { EmailRow, EmailStatus } from '@/lib/types';
import { useSession } from '@/lib/session';
import { badgeTime } from '@/lib/utils';
import { ClockIcon, FilterIcon, RefreshIcon, SearchIcon } from './icons';
import { IconButton } from './ui/Input';
import { StatusPill } from './StatusPill';

type Mode = 'scheduled' | 'sent';
const FILTERS: Record<Mode, EmailStatus[]> = { scheduled: ['scheduled', 'processing'], sent: ['sent', 'failed'] };

export function EmailList({ mode }: { mode: Mode }) {
  const { toast } = useSession();
  const [rows, setRows] = useState<EmailRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<EmailStatus | 'all'>('all');
  const [menu, setMenu] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try { setRows(await api.emails(mode, q)); } catch (e) { toast((e as Error).message, 'error'); } finally { setLoading(false); }
  }, [mode, q, toast]);

  useEffect(() => { const t = setTimeout(() => load(), q ? 300 : 0); return () => clearTimeout(t); }, [load, q]);
  useEffect(() => { const t = setInterval(() => load(true), 5000); return () => clearInterval(t); }, [load]);

  const shown = filter === 'all' ? rows : rows.filter((r) => r.status === filter);
  return (
    <section className="flex-1 p-4 md:p-6">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex flex-1 items-center gap-2 rounded-full bg-surface px-4 py-2">
          <SearchIcon className="text-mute" />
          <input value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search emails" placeholder="Search" className="w-full bg-transparent text-sm placeholder:text-mute focus:outline-none" />
        </div>
        <div className="relative">
          <IconButton label="Filter by status" onClick={() => setMenu(!menu)}><FilterIcon /></IconButton>
          {menu && <div className="absolute right-0 z-10 mt-1 w-36 rounded-lg border border-line bg-white py-1 text-sm shadow">
            {(['all', ...FILTERS[mode]] as const).map((f) => (
              <button key={f} onClick={() => { setFilter(f); setMenu(false); }} className={`block w-full px-3 py-1.5 text-left capitalize hover:bg-surface ${filter === f ? 'font-medium text-brand' : ''}`}>{f}</button>))}
          </div>}
        </div>
        <IconButton label="Refresh" onClick={() => load()}><RefreshIcon /></IconButton>
      </div>

      {loading ? <div className="space-y-3" aria-busy="true">{[0, 1, 2, 3, 4].map((i) => <div key={i} className="h-10 animate-pulse rounded-lg bg-surface" />)}</div>
        : !shown.length ? (
          <div className="py-24 text-center">
            <p className="font-medium">{mode === 'sent' ? 'Nothing sent yet' : 'No scheduled emails'}</p>
            <p className="mt-1 text-sm text-mute">{q || filter !== 'all' ? 'No emails match your search or filter.' : mode === 'sent' ? 'Emails appear here once they are delivered.' : 'Choose Compose to schedule your first batch.'}</p>
          </div>
        ) : (
          <ul>{shown.map((r) => (
            <li key={r.id} className="border-b border-line/70">
              <Link href={`/dashboard/email/${r.id}`} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-3 text-sm hover:bg-surface/60 md:flex-nowrap">
                <span className="w-full shrink-0 truncate md:w-52">To: {r.recipient}</span>
                <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-0.5 text-xs ${mode === 'scheduled' ? 'bg-amber-soft text-amber-ink' : 'bg-surface text-mute'}`}>
                  <ClockIcon width={12} height={12} />{badgeTime(mode === 'sent' ? r.sent_at : r.scheduled_at)}
                </span>
                <StatusPill status={r.status} />
                <span className="min-w-0 flex-1 truncate"><span className="font-medium">{r.subject}</span><span className="text-mute"> - {r.preview}</span></span>
              </Link>
            </li>))}</ul>
        )}
    </section>
  );
}

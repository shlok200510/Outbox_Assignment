'use client';
import { useState } from 'react';
import { Button } from './ui/Button';
import { ClockIcon } from './icons';

const toLocalInput = (d: Date) => { const x = new Date(d.getTime() - d.getTimezoneOffset() * 60000); return x.toISOString().slice(0, 16); };
const tomorrowAt = (h: number) => { const d = new Date(); d.setDate(d.getDate() + 1); d.setHours(h, 0, 0, 0); return d; };
const QUICK = [{ label: 'Tomorrow, 10:00 AM', h: 10 }, { label: 'Tomorrow, 11:00 AM', h: 11 }, { label: 'Tomorrow, 3:00 PM', h: 15 }];

export function SendLater({ busy, onConfirm }: { busy: boolean; onConfirm: (at: Date) => void }) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(() => toLocalInput(new Date(Date.now() + 3600_000)));
  return (
    <div className="relative">
      <Button variant="outline" onClick={() => setOpen(!open)} aria-expanded={open}><ClockIcon width={14} height={14} />Send Later</Button>
      {open && (
        <div className="absolute right-0 z-20 mt-2 w-64 rounded-xl border border-line bg-white p-4 text-sm shadow-lg">
          <p className="mb-2 font-medium">Send later</p>
          <input type="datetime-local" aria-label="Send date and time" value={value} onChange={(e) => setValue(e.target.value)} className="mb-2 w-full rounded-lg bg-surface px-2 py-2 text-xs" />
          <ul className="mb-3">{QUICK.map((q) => (
            <li key={q.label}><button onClick={() => setValue(toLocalInput(tomorrowAt(q.h)))} className="w-full rounded px-1 py-1.5 text-left text-xs hover:bg-surface">{q.label}</button></li>))}</ul>
          <div className="flex justify-end gap-2">
            <Button variant="soft" className="!px-4 !py-1.5" onClick={() => setOpen(false)}>Cancel</Button>
            <Button variant="outline" className="!px-4 !py-1.5" loading={busy} onClick={() => value && onConfirm(new Date(value))}>Done</Button>
          </div>
        </div>)}
    </div>
  );
}

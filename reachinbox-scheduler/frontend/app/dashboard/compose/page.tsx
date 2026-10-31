'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import type { Sender } from '@/lib/types';
import { useSession } from '@/lib/session';
import { plainText } from '@/lib/utils';
import { BackIcon } from '@/components/icons';
import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/Input';
import { RecipientsField } from '@/components/RecipientsField';
import { RichEditor } from '@/components/RichEditor';
import { SendLater } from '@/components/SendLater';

const row = 'flex items-center gap-4 border-b border-line py-3';
const label = 'w-14 shrink-0 text-xs text-mute';
const small = 'w-16 rounded-md bg-surface px-2 py-1.5 text-center text-xs placeholder:text-mute';

export default function ComposePage() {
  const router = useRouter();
  const { toast, refreshCounts } = useSession();
  const [senders, setSenders] = useState<Sender[]>([]);
  const [from, setFrom] = useState('auto');
  const [emails, setEmails] = useState<string[]>([]);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [delay, setDelay] = useState('');
  const [limit, setLimit] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => { api.senders().then(setSenders).catch(() => {}); }, []);

  const submit = async (at: Date) => {
    if (!emails.length) return toast('Add at least one recipient or upload a list.', 'error');
    if (!subject.trim()) return toast('Add a subject.', 'error');
    if (!plainText(body)) return toast('Write a message body.', 'error');
    setBusy(true);
    try {
      const r = await api.schedule({ subject, body, recipients: emails, startTime: at.toISOString(),
        delaySeconds: Math.max(0, Number(delay) || 0), hourlyLimit: Number(limit) > 0 ? Number(limit) : undefined,
        senderId: from === 'auto' ? undefined : Number(from) });
      toast(`${r.scheduled} email${r.scheduled === 1 ? '' : 's'} scheduled.`);
      refreshCounts();
      router.push('/dashboard');
    } catch (e) { toast((e as Error).message, 'error'); } finally { setBusy(false); }
  };

  return (
    <section className="p-4 md:p-6">
      <div className="mb-4 flex items-center gap-3">
        <IconButton label="Back" onClick={() => router.back()}><BackIcon /></IconButton>
        <h1 className="flex-1 text-base font-medium">Compose New Email</h1>
        <SendLater busy={busy} onConfirm={submit} />
        <Button loading={busy} onClick={() => submit(new Date())}>Send</Button>
      </div>
      <div className="mx-auto max-w-3xl">
        <div className={row}><span className={label}>From</span>
          <select value={from} onChange={(e) => setFrom(e.target.value)} aria-label="From" className="rounded-md bg-surface px-2 py-1.5 text-xs">
            <option value="auto">Rotate across all senders</option>
            {senders.map((s) => <option key={s.id} value={s.id}>{s.email}</option>)}
          </select></div>
        <div className={row}><span className={label}>To</span><div className="min-w-0 flex-1"><RecipientsField emails={emails} onChange={setEmails} /></div></div>
        <div className={row}><span className={label}>Subject</span>
          <input value={subject} onChange={(e) => setSubject(e.target.value)} aria-label="Subject" placeholder="Subject" className="flex-1 bg-transparent text-sm placeholder:text-mute focus:outline-none" /></div>
        <div className={`${row} flex-wrap`}>
          <label className="flex items-center gap-2 text-xs text-mute">Delay between 2 emails (seconds)
            <input type="number" min={0} value={delay} onChange={(e) => setDelay(e.target.value)} placeholder="00" className={small} /></label>
          <label className="flex items-center gap-2 text-xs text-mute">Hourly Limit
            <input type="number" min={1} value={limit} onChange={(e) => setLimit(e.target.value)} placeholder="00" className={small} /></label>
          {emails.length > 0 && <span className="ml-auto text-xs font-medium text-brand-dark">{emails.length} recipient{emails.length === 1 ? '' : 's'}</span>}
        </div>
        <div className="mt-4"><RichEditor onChange={setBody} /></div>
      </div>
    </section>
  );
}

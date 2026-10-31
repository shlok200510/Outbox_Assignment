'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import type { EmailDetail } from '@/lib/types';
import { fullTime } from '@/lib/utils';
import { BackIcon } from '@/components/icons';
import { StatusPill } from '@/components/StatusPill';
import { IconButton } from '@/components/ui/Input';

export default function EmailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [mail, setMail] = useState<EmailDetail | null>(null);
  const [error, setError] = useState('');
  useEffect(() => { api.email(id).then(setMail).catch((e) => setError(e.message)); }, [id]);

  return (
    <section className="p-4 md:p-6">
      <div className="mb-6 flex items-center gap-3">
        <IconButton label="Back" onClick={() => router.back()}><BackIcon /></IconButton>
        <h1 className="truncate text-base font-medium">{mail?.subject ?? 'Email'}</h1>
      </div>
      {error ? <p className="text-sm text-red-600">{error}</p> : !mail ? <div className="h-40 animate-pulse rounded-xl bg-surface" /> : (
        <div className="max-w-3xl space-y-4 text-sm">
          <dl className="grid grid-cols-[5rem_1fr] gap-y-1.5">
            <dt className="text-mute">From</dt><dd>{mail.sender_email}</dd>
            <dt className="text-mute">To</dt><dd>{mail.recipient}</dd>
            <dt className="text-mute">{mail.sent_at ? 'Sent' : 'Scheduled'}</dt><dd>{fullTime(mail.sent_at || mail.scheduled_at)}</dd>
            <dt className="text-mute">Status</dt><dd className="flex items-center gap-3"><StatusPill status={mail.status} />
              {mail.preview_url && <a href={mail.preview_url} target="_blank" rel="noreferrer" className="text-xs font-medium text-brand hover:underline">Open Ethereal preview</a>}</dd>
            {mail.error && <><dt className="text-mute">Error</dt><dd className="text-red-600">{mail.error}</dd></>}
          </dl>
          {/* sandboxed iframe: user HTML can never run scripts */}
          <iframe title="Email body" sandbox="" srcDoc={`<base target="_blank"><body style="font:14px Inter,system-ui,sans-serif;margin:0">${mail.body}</body>`} className="h-96 w-full rounded-xl border border-line" />
        </div>)}
    </section>
  );
}

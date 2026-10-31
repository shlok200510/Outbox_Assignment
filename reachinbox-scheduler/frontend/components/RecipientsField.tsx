'use client';
import { useRef, useState } from 'react';
import { extractEmails } from '@/lib/utils';

export function RecipientsField({ emails, onChange }: { emails: string[]; onChange: (e: string[]) => void }) {
  const file = useRef<HTMLInputElement>(null);
  const [text, setText] = useState('');
  const merge = (found: string[]) => onChange(Array.from(new Set([...emails, ...found])));
  const commit = () => { if (text.trim()) merge(extractEmails(text)); setText(''); };
  return (
    <div className="flex items-center gap-3">
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
        {emails.slice(0, 3).map((e) => (
          <span key={e} className="inline-flex items-center gap-1 rounded-full border border-brand bg-brand-soft px-2 py-0.5 text-xs">{e}
            <button aria-label={`Remove ${e}`} onClick={() => onChange(emails.filter((x) => x !== e))} className="text-mute hover:text-ink">×</button></span>))}
        {emails.length > 3 && <span className="rounded-full border border-brand bg-brand-soft px-2 py-0.5 text-xs" title={emails.slice(3).join(', ')}>+{emails.length - 3}</span>}
        <input value={text} onChange={(e) => setText(e.target.value)} onBlur={commit} aria-label="Recipients"
          onKeyDown={(e) => { if (['Enter', ',', ' '].includes(e.key)) { e.preventDefault(); commit(); } }}
          placeholder={emails.length ? '' : 'recipient@example.com'} className="min-w-[10rem] flex-1 bg-transparent text-sm placeholder:text-mute focus:outline-none" />
      </div>
      <input ref={file} type="file" accept=".csv,.txt,text/csv,text/plain" className="hidden" aria-label="Upload leads file"
        onChange={async (e) => { const f = e.target.files?.[0]; if (f) merge(extractEmails(await f.text())); e.target.value = ''; }} />
      <button onClick={() => file.current?.click()} className="shrink-0 text-xs font-medium text-brand hover:underline">Upload List</button>
    </div>
  );
}

'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { SlackStatus } from '@/lib/types';
import { useSession } from '@/lib/session';
import { Button } from './ui/Button';

export function SlackCard() {
  const { toast } = useSession();
  const [s, setS] = useState<SlackStatus | null>(null);
  const load = () => api.slack().then(setS).catch(() => setS(null));
  useEffect(() => { load(); }, []);
  if (!s) return null;
  const connect = async () => { try { window.location.href = (await api.slackUrl()).url; } catch (e) { toast((e as Error).message, 'error'); } };
  const disconnect = async () => { await api.slackDisconnect(); load(); };
  return (
    <div className="rounded-xl bg-surface p-3 text-xs">
      <p className="font-medium text-ink">Slack alerts</p>
      <p className="mb-2 mt-0.5 text-mute">{s.connected ? `Rate-limit alerts go to ${s.channel || 'your channel'}.` : 'Get notified when a sender hits its hourly limit.'}</p>
      {s.connected ? <Button variant="outline" className="w-full !py-1.5" onClick={disconnect}>Disconnect Slack</Button>
        : <Button className="w-full !py-1.5" onClick={connect} disabled={!s.configured} title={s.configured ? '' : 'Set SLACK_CLIENT_ID/SECRET on the backend'}>Connect Slack</Button>}
    </div>
  );
}

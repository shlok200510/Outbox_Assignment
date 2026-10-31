import type { Counts, EmailDetail, EmailRow, ScheduleInput, Sender, SlackStatus, User } from './types';
export const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, { credentials: 'include',
    headers: init?.body ? { 'Content-Type': 'application/json' } : undefined, ...init });
  if (!res.ok) throw Object.assign(new Error((await res.json().catch(() => ({}))).error || res.statusText), { status: res.status });
  return res.json();
}
export const api = {
  me: () => req<User>('/api/me'),
  logout: () => req<{ ok: boolean }>('/auth/logout', { method: 'POST' }),
  emails: (status: 'scheduled' | 'sent', q = '') => req<EmailRow[]>(`/api/emails?status=${status}&q=${encodeURIComponent(q)}`),
  email: (id: string) => req<EmailDetail>(`/api/emails/${id}`),
  counts: () => req<Counts>('/api/counts'),
  senders: () => req<Sender[]>('/api/senders'),
  schedule: (b: ScheduleInput) => req<{ scheduled: number }>('/api/schedule', { method: 'POST', body: JSON.stringify(b) }),
  slack: () => req<SlackStatus>('/api/slack'),
  slackUrl: () => req<{ url: string }>('/api/slack/url'),
  slackDisconnect: () => req<{ ok: boolean }>('/api/slack', { method: 'DELETE' }),
};

'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { useSession } from '@/lib/session';
import { ChevronIcon, ClockIcon, SendIcon } from './icons';
import { SlackCard } from './SlackCard';

export function Sidebar() {
  const { user, counts, logout } = useSession();
  const path = usePathname();
  const [menu, setMenu] = useState(false);
  const nav = [
    { href: '/dashboard', label: 'Scheduled', count: counts.scheduled, icon: <ClockIcon />, active: path === '/dashboard' },
    { href: '/dashboard/sent', label: 'Sent', count: counts.sent, icon: <SendIcon />, active: path === '/dashboard/sent' },
  ];
  return (
    <aside className="flex w-full shrink-0 flex-col gap-4 border-b border-line p-4 md:min-h-screen md:w-64 md:border-b-0">
      <span className="font-logo text-3xl font-bold tracking-tight">ONB</span>
      <div className="relative">
        <button onClick={() => setMenu(!menu)} aria-expanded={menu} className="flex w-full items-center gap-3 rounded-xl bg-surface p-2.5 text-left">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={user.avatar} alt="" referrerPolicy="no-referrer" className="h-8 w-8 rounded-full bg-line" />
          <span className="min-w-0 flex-1 text-xs leading-tight"><span className="block truncate font-medium">{user.name}</span><span className="block truncate text-mute">{user.email}</span></span>
          <ChevronIcon className="text-mute" />
        </button>
        {menu && <button onClick={logout} className="absolute left-0 right-0 top-full z-10 mt-1 rounded-lg border border-line bg-white px-3 py-2 text-left text-sm shadow hover:bg-surface">Log out</button>}
      </div>
      <Link href="/dashboard/compose" className="rounded-full border border-brand py-2 text-center text-sm font-medium text-brand hover:bg-brand-soft">Compose</Link>
      <nav aria-label="Mailbox" className="space-y-1">
        <p className="px-2 pb-1 text-xs text-mute">Core</p>
        {nav.map((n) => (
          <Link key={n.href} href={n.href} aria-current={n.active ? 'page' : undefined}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm ${n.active ? 'bg-brand-soft font-medium' : 'text-ink/80 hover:bg-surface'}`}>
            {n.icon}<span className="flex-1">{n.label}</span><span className="text-xs text-mute">{n.count}</span>
          </Link>))}
      </nav>
      <div className="mt-auto"><SlackCard /></div>
    </aside>
  );
}

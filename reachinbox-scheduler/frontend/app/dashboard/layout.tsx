import type { ReactNode } from 'react';
import { SessionProvider } from '@/lib/session';
import { Sidebar } from '@/components/Sidebar';
export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <SessionProvider><div className="flex min-h-screen flex-col md:flex-row"><Sidebar /><main className="flex min-w-0 flex-1 flex-col">{children}</main></div></SessionProvider>;
}

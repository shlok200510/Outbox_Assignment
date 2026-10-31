import './globals.css';
import { Inter, Space_Grotesk } from 'next/font/google';
import type { ReactNode } from 'react';
const sans = Inter({ subsets: ['latin'], variable: '--font-sans' });
const logo = Space_Grotesk({ subsets: ['latin'], weight: '700', variable: '--font-logo' });
export const metadata = { title: 'ONB · Email scheduler' };
export default function RootLayout({ children }: { children: ReactNode }) {
  return <html lang="en"><body className={`${sans.variable} ${logo.variable} font-sans`}>{children}</body></html>;
}

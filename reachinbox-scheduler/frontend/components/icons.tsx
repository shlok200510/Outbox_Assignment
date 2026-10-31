import type { ReactNode, SVGProps } from 'react';
const I = ({ paths, ...p }: SVGProps<SVGSVGElement> & { paths: ReactNode }) => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...p}>{paths}</svg>);
export const ClockIcon = (p: SVGProps<SVGSVGElement>) => <I {...p} paths={<><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>} />;
export const SendIcon = (p: SVGProps<SVGSVGElement>) => <I {...p} paths={<path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z" />} />;
export const SearchIcon = (p: SVGProps<SVGSVGElement>) => <I {...p} paths={<><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></>} />;
export const FilterIcon = (p: SVGProps<SVGSVGElement>) => <I {...p} paths={<path d="M3 5h18l-7 8v6l-4 2v-8L3 5z" />} />;
export const RefreshIcon = (p: SVGProps<SVGSVGElement>) => <I {...p} paths={<path d="M21 12a9 9 0 1 1-3-6.7L21 8M21 3v5h-5" />} />;
export const BackIcon = (p: SVGProps<SVGSVGElement>) => <I {...p} paths={<path d="M19 12H5M12 19l-7-7 7-7" />} />;
export const ChevronIcon = (p: SVGProps<SVGSVGElement>) => <I {...p} paths={<path d="m6 9 6 6 6-6" />} />;
export const BoldIcon = (p: SVGProps<SVGSVGElement>) => <I {...p} paths={<path d="M6 4h8a4 4 0 0 1 0 8H6zM6 12h9a4 4 0 0 1 0 8H6z" />} />;
export const ItalicIcon = (p: SVGProps<SVGSVGElement>) => <I {...p} paths={<path d="M19 4h-9M14 20H5M15 4 9 20" />} />;
export const UnderlineIcon = (p: SVGProps<SVGSVGElement>) => <I {...p} paths={<path d="M6 3v7a6 6 0 0 0 12 0V3M4 21h16" />} />;
export const ListIcon = (p: SVGProps<SVGSVGElement>) => <I {...p} paths={<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />} />;
export const ListOrderedIcon = (p: SVGProps<SVGSVGElement>) => <I {...p} paths={<path d="M10 6h11M10 12h11M10 18h11M4 6h1v4M4 10h2M6 18H4c0-1 2-2 2-3s-1-1.5-2-1" />} />;
export const UndoIcon = (p: SVGProps<SVGSVGElement>) => <I {...p} paths={<path d="M3 7v6h6M3 13a9 9 0 1 0 3-7.7L3 8" />} />;
export const RedoIcon = (p: SVGProps<SVGSVGElement>) => <I {...p} paths={<path d="M21 7v6h-6M21 13a9 9 0 1 1-3-7.7L21 8" />} />;
export const GoogleIcon = () => (
  <svg viewBox="0 0 18 18" width="16" height="16" aria-hidden="true">
    <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z" />
    <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.33-1.58-5.04-3.7H.96v2.34A9 9 0 0 0 9 18z" />
    <path fill="#FBBC05" d="M3.96 10.72A5.4 5.4 0 0 1 3.68 9c0-.6.1-1.18.28-1.72V4.94H.96A9 9 0 0 0 0 9c0 1.45.35 2.82.96 4.06l3-2.34z" />
    <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58A9 9 0 0 0 .96 4.94l3 2.34C4.67 5.16 6.66 3.58 9 3.58z" />
  </svg>);

import type { InputHTMLAttributes } from 'react';
export const Input = ({ className = '', ...p }: InputHTMLAttributes<HTMLInputElement>) =>
  <input {...p} className={`w-full rounded-lg bg-surface px-3 py-2.5 text-sm placeholder:text-mute ${className}`} />;
export const IconButton = ({ label, children, ...p }: React.ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) =>
  <button aria-label={label} title={label} {...p} className={`rounded-md p-2 text-mute hover:bg-surface hover:text-ink ${p.className || ''}`}>{children}</button>;

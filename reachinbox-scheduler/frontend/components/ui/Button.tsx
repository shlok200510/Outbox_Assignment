import type { ButtonHTMLAttributes } from 'react';
type Props = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'solid' | 'outline' | 'soft'; loading?: boolean };
const variants = {
  solid: 'bg-brand text-white hover:bg-brand-dark',
  outline: 'border border-brand text-brand hover:bg-brand-soft bg-white',
  soft: 'bg-brand-soft text-ink hover:bg-brand-soft/70',
};
export function Button({ variant = 'solid', loading, className = '', children, disabled, ...rest }: Props) {
  return <button disabled={disabled || loading} {...rest}
    className={`inline-flex items-center justify-center gap-2 rounded-full px-5 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`}>
    {loading ? 'Working…' : children}</button>;
}

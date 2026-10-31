import type { EmailStatus } from '@/lib/types';
const styles: Record<EmailStatus, string> = {
  scheduled: 'bg-amber-soft text-amber-ink', processing: 'bg-blue-100 text-blue-700',
  sent: 'bg-brand-soft text-brand-dark', failed: 'bg-red-100 text-red-700',
};
const label: Record<EmailStatus, string> = { scheduled: 'Scheduled', processing: 'Sending', sent: 'Sent', failed: 'Failed' };
export const StatusPill = ({ status }: { status: EmailStatus }) =>
  <span className={`shrink-0 rounded-md px-2 py-0.5 text-xs font-medium ${styles[status]}`}>{label[status]}</span>;

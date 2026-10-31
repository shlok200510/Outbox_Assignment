export interface User { id: string; email: string; name: string; avatar: string }
export type EmailStatus = 'scheduled' | 'processing' | 'sent' | 'failed';
export interface EmailRow {
  id: string; recipient: string; subject: string; preview: string; scheduled_at: string;
  sent_at: string | null; status: EmailStatus; preview_url: string | null; error: string | null;
}
export interface EmailDetail extends Omit<EmailRow, 'preview'> { body: string; sender_email: string }
export interface Sender { id: number; email: string }
export interface Counts { scheduled: number; sent: number }
export interface SlackStatus { connected: boolean; configured: boolean; channel?: string; team?: string }
export interface ScheduleInput {
  subject: string; body: string; recipients: string[]; startTime: string; delaySeconds: number; hourlyLimit?: number; senderId?: number;
}

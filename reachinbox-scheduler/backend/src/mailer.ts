import nodemailer from 'nodemailer';
import { pool } from './db';
import { cfg } from './config';

export interface Sender { id: number; email: string; smtp_user: string; smtp_pass: string }
const transports = new Map<number, nodemailer.Transporter>();

// Creates Ethereal (fake SMTP) accounts until SENDER_COUNT exists.
export async function ensureSenders() {
  const { rows } = await pool.query('SELECT count(*)::int AS c FROM senders');
  for (let i = rows[0].c; i < cfg.senderCount; i++) {
    const a = await nodemailer.createTestAccount();
    await pool.query('INSERT INTO senders(email,smtp_user,smtp_pass) VALUES($1,$2,$3)', [a.user, a.user, a.pass]);
  }
}
export const listSenders = async (): Promise<Sender[]> =>
  (await pool.query('SELECT * FROM senders ORDER BY id')).rows;

export const stripHtml = (h: string) => h.replace(/<br\s*\/?>|<\/(p|div|li)>/gi, '\n').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim();

export async function sendMail(s: Sender, to: string, subject: string, text: string, emailId: string) {
  let t = transports.get(s.id);
  if (!t) {
    t = nodemailer.createTransport({ host: 'smtp.ethereal.email', port: 587, auth: { user: s.smtp_user, pass: s.smtp_pass } });
    transports.set(s.id, t);
  }
  const info = await t.sendMail({ from: s.email, to, subject, text: stripHtml(text), html: text, messageId: `<${emailId}@scheduler.local>` });
  return nodemailer.getTestMessageUrl(info) || null;
}

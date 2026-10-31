import { pool } from './db';
import { connection } from './redis';

// Never throws: if the user has no Slack connection we silently skip.
export async function notifyRateLimit(userId: string, senderEmail: string, limit: number, windowIdx: number) {
  try {
    const { rows } = await pool.query('SELECT webhook_url FROM slack_connections WHERE user_id=$1', [userId]);
    if (!rows.length) return;
    // one message per user+sender per hour window
    const first = await connection.set(`slackn:${userId}:${senderEmail}:${windowIdx}`, '1', 'EX', 7200, 'NX');
    if (!first) return;
    const res = await fetch(rows[0].webhook_url, { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: `:warning: Hourly limit of ${limit} emails reached for sender ${senderEmail}. Remaining emails were rescheduled to the next hour window.` }) });
    if (!res.ok) console.warn('[slack] webhook responded', res.status);
  } catch (e) { console.warn('[slack] notify failed:', (e as Error).message); }
}

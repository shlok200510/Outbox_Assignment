import { Worker, DelayedError } from 'bullmq';
import { connection, takeSlot } from './redis';
import { QUEUE_NAME, emailQueue } from './queue';
import { pool } from './db';
import { cfg, HOUR_MS } from './config';
import { listSenders, sendMail } from './mailer';
import { indexEmail } from './search';
import { notifyRateLimit } from './slack';

async function setStatus(id: string, fields: Record<string, any>) {
  const keys = Object.keys(fields);
  const { rows } = await pool.query(
    `UPDATE emails SET ${keys.map((k, i) => `${k}=$${i + 2}`).join(',')} WHERE id=$1 RETURNING *`, [id, ...keys.map((k) => fields[k])]);
  if (rows[0]) await indexEmail(rows[0]);
  return rows[0];
}

export function startWorker() {
  const worker = new Worker(QUEUE_NAME, async (job, token) => {
    const { emailId } = job.data as { emailId: string };

    // IDEMPOTENCY: atomically claim the row. A duplicate/replayed job finds status != 'scheduled' and exits.
    const claim = await pool.query(`UPDATE emails SET status='processing' WHERE id=$1 AND status='scheduled' RETURNING *`, [emailId]);
    if (!claim.rowCount) return 'skipped';
    const email = claim.rows[0];
    const sender = (await listSenders()).find((s) => s.id === email.sender_id)!;

    // HOURLY RATE LIMIT (Redis, shared across workers)
    const limit = email.hourly_limit ?? cfg.maxPerHour;
    const win = Math.floor(Date.now() / HOUR_MS);
    if (!(await takeSlot(sender.id, win, limit))) {
      const key = `overflow:${sender.id}:${win}`;
      const slot = await connection.incr(key);
      await connection.expire(key, 7200);
      const when = (win + 1) * HOUR_MS + (slot - 1) * cfg.minDelayMs; // keeps relative order in the next window
      await setStatus(emailId, { status: 'scheduled', scheduled_at: new Date(when) });
      notifyRateLimit(email.user_id, sender.email, limit, win);
      await job.moveToDelayed(when, token); // not dropped, not failed
      throw new DelayedError();
    }

    try {
      const previewUrl = await sendMail(sender, email.recipient, email.subject, email.body, emailId);
      await setStatus(emailId, { status: 'sent', sent_at: new Date(), preview_url: previewUrl, error: null });
    } catch (err) {
      const last = job.attemptsMade + 1 >= (job.opts.attempts ?? 1);
      await setStatus(emailId, last ? { status: 'failed', sent_at: new Date(), error: (err as Error).message } : { status: 'scheduled' });
      throw err; // BullMQ retries with backoff
    }
  }, {
    connection,
    concurrency: cfg.concurrency,
    // MIN DELAY BETWEEN SENDS: at most 1 job starts per MIN_DELAY_BETWEEN_EMAILS_MS
    limiter: { max: 1, duration: cfg.minDelayMs },
  });
  worker.on('error', (e) => console.error('[worker]', e.message));
  return worker;
}

// RESTART SAFETY: Postgres is the source of truth. On boot, re-enqueue any pending row missing from Redis.
// (Runs once at startup, not a cron.) jobId == emailId so re-adding can never create a duplicate job.
export async function reconcile() {
  await pool.query(`UPDATE emails SET status='scheduled' WHERE status='processing' AND scheduled_at < now() - interval '5 minutes'`);
  const { rows } = await pool.query(`SELECT id, scheduled_at FROM emails WHERE status='scheduled'`);
  let restored = 0;
  for (const r of rows) {
    if (await emailQueue.getJob(r.id)) continue;
    await emailQueue.add('send', { emailId: r.id }, { jobId: r.id, delay: Math.max(0, +new Date(r.scheduled_at) - Date.now()) });
    restored++;
  }
  console.log(`[reconcile] ${rows.length} pending emails, ${restored} re-enqueued`);
}

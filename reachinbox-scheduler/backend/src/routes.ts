import { Router } from 'express';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import { pool } from './db';
import { cfg, HOUR_MS } from './config';
import { AuthedRequest, requireAuth } from './auth';
import { emailQueue } from './queue';
import { listSenders } from './mailer';
import { bulkIndex, searchEmails } from './search';

export const api = Router();
api.use(requireAuth);

api.get('/me', async (req: AuthedRequest, res) => {
  const { rows } = await pool.query('SELECT id,email,name,avatar FROM users WHERE id=$1', [req.userId]);
  rows[0] ? res.json(rows[0]) : res.status(401).json({ error: 'Unknown user' });
});

const scheduleSchema = z.object({
  subject: z.string().min(1), body: z.string().min(1),
  recipients: z.array(z.string().email()).min(1).max(20000),
  startTime: z.string().datetime({ offset: true }),
  delaySeconds: z.number().min(0).max(86400),
  hourlyLimit: z.number().int().min(1).optional(),
  senderId: z.number().int().optional(),
});

api.post('/schedule', async (req: AuthedRequest, res) => {
  const parsed = scheduleSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });
  const { subject, body, recipients, startTime, delaySeconds, hourlyLimit, senderId } = parsed.data;
  const senders = await listSenders();
  const limit = hourlyLimit ?? cfg.maxPerHour;
  const start = Math.max(+new Date(startTime), Date.now());
  const used = new Map<string, number>();
  const rows: any[] = [];

  recipients.forEach((to, i) => {
    const s = senders.find((x) => x.id === senderId) ?? senders[i % senders.length]; // fixed sender, or round-robin
    let t = start + i * delaySeconds * 1000;
    let w = Math.floor(t / HOUR_MS);
    // pre-plan: push into the next hour window when this sender's quota for that window is full
    while ((used.get(`${s.id}:${w}`) ?? 0) >= limit) { w++; t = Math.max(t, w * HOUR_MS); }
    used.set(`${s.id}:${w}`, (used.get(`${s.id}:${w}`) ?? 0) + 1);
    rows.push({ id: randomUUID(), user_id: req.userId, sender_id: s.id, recipient: to, subject, body,
      scheduled_at: new Date(t), sent_at: null, status: 'scheduled', hourly_limit: limit });
  });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const r of rows)
      await client.query(`INSERT INTO emails(id,user_id,sender_id,recipient,subject,body,scheduled_at,hourly_limit) VALUES($1,$2,$3,$4,$5,$6,$7,$8)`,
        [r.id, r.user_id, r.sender_id, r.recipient, r.subject, r.body, r.scheduled_at, r.hourly_limit]);
    await client.query('COMMIT');
  } catch (e) { await client.query('ROLLBACK'); throw e; } finally { client.release(); }

  await emailQueue.addBulk(rows.map((r) => ({ name: 'send', data: { emailId: r.id },
    opts: { jobId: r.id, delay: Math.max(0, +r.scheduled_at - Date.now()) } })));
  await bulkIndex(rows);
  res.status(201).json({ scheduled: rows.length, firstAt: rows[0].scheduled_at, lastAt: rows[rows.length - 1].scheduled_at });
});

const STATUS = { scheduled: ['scheduled', 'processing'], sent: ['sent', 'failed'] } as const;
api.get('/emails', async (req: AuthedRequest, res) => {
  const tab = req.query.status === 'sent' ? 'sent' : 'scheduled';
  const q = String(req.query.q || '').trim();
  const order = tab === 'sent' ? 'sent_at DESC' : 'scheduled_at ASC';
  let ids: string[] | null = null;
  if (q) ids = (await searchEmails(req.userId!, q, [...STATUS[tab]])).map((h) => h.id);
  const { rows } = await pool.query(
    `SELECT id,recipient,subject,scheduled_at,sent_at,status,preview_url,error,
            left(regexp_replace(body,'<[^>]+>',' ','g'),140) AS preview FROM emails
     WHERE user_id=$1 AND status = ANY($2) ${ids ? 'AND id = ANY($3)' : ''} ORDER BY ${order} LIMIT 500`,
    ids ? [req.userId, STATUS[tab], ids] : [req.userId, STATUS[tab]]);
  res.json(rows);
});

api.get('/emails/:id', async (req: AuthedRequest, res) => {
  const { rows } = await pool.query(
    `SELECT e.id,e.recipient,e.subject,e.body,e.scheduled_at,e.sent_at,e.status,e.preview_url,e.error,s.email AS sender_email
     FROM emails e JOIN senders s ON s.id=e.sender_id WHERE e.id=$1 AND e.user_id=$2`, [req.params.id, req.userId]);
  rows[0] ? res.json(rows[0]) : res.status(404).json({ error: 'Email not found' });
});
api.get('/counts', async (req: AuthedRequest, res) => {
  const { rows } = await pool.query(
    `SELECT count(*) FILTER (WHERE status IN ('scheduled','processing'))::int AS scheduled,
            count(*) FILTER (WHERE status IN ('sent','failed'))::int AS sent FROM emails WHERE user_id=$1`, [req.userId]);
  res.json(rows[0]);
});
api.get('/senders', async (_req, res) => res.json((await listSenders()).map((s) => ({ id: s.id, email: s.email }))));

// ---- Slack (per-user incoming webhook via OAuth) ----
api.get('/slack', async (req: AuthedRequest, res) => {
  const { rows } = await pool.query('SELECT channel, team FROM slack_connections WHERE user_id=$1', [req.userId]);
  res.json({ connected: rows.length > 0, ...(rows[0] || {}), configured: !!cfg.slack.id });
});
api.delete('/slack', async (req: AuthedRequest, res) => {
  await pool.query('DELETE FROM slack_connections WHERE user_id=$1', [req.userId]);
  res.json({ ok: true });
});
api.get('/slack/url', (req: AuthedRequest, res) => {
  const state = jwt.sign({ uid: req.userId }, cfg.jwtSecret, { expiresIn: '10m' });
  const u = new URL('https://slack.com/oauth/v2/authorize');
  u.search = new URLSearchParams({ client_id: cfg.slack.id, scope: 'incoming-webhook',
    redirect_uri: `${cfg.backendUrl}/slack/callback`, state }).toString();
  res.json({ url: u.toString() });
});

// Public callback: identity comes from the signed `state`, not the cookie.
export const slackCallback = Router();
slackCallback.get('/callback', async (req, res) => {
  try {
    const { uid } = jwt.verify(String(req.query.state), cfg.jwtSecret) as any;
    const r = await fetch('https://slack.com/api/oauth.v2.access', { method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ code: String(req.query.code), client_id: cfg.slack.id,
        client_secret: cfg.slack.secret, redirect_uri: `${cfg.backendUrl}/slack/callback` }) });
    const d: any = await r.json();
    if (!d.ok) throw new Error(d.error);
    await pool.query(
      `INSERT INTO slack_connections(user_id,webhook_url,channel,team) VALUES($1,$2,$3,$4)
       ON CONFLICT (user_id) DO UPDATE SET webhook_url=$2, channel=$3, team=$4, connected_at=now()`,
      [uid, d.incoming_webhook.url, d.incoming_webhook.channel, d.team?.name]);
    res.redirect(`${cfg.frontendUrl}/dashboard?slack=connected`);
  } catch (e) { res.redirect(`${cfg.frontendUrl}/dashboard?slack=error`); }
});

# Email Job Scheduler (BullMQ + Redis + Postgres + Elasticsearch + Next.js)

Schedules emails via BullMQ delayed jobs (no cron), sends through Ethereal SMTP from multiple senders,
survives restarts, never double-sends, enforces per-sender hourly limits, and posts to Slack when a limit is hit.

## 1. Prerequisites
Node 18.18+ (uses global `fetch`), Docker, a Google Cloud project, and (optional but required for the Slack demo) a Slack app.

## 2. Start infrastructure
```bash
docker compose up -d        # Postgres :5432, Redis :6379, Elasticsearch :9200
```

## 3. Google OAuth (login)
1. Google Cloud Console -> APIs & Services -> Credentials -> Create **OAuth client ID** (Web application).
2. Authorized redirect URI: `http://localhost:4000/auth/google/callback`
3. Copy the client ID/secret into `backend/.env`.

## 4. Slack OAuth (rate-limit alerts)
1. https://api.slack.com/apps -> Create New App -> From scratch.
2. **Features -> Incoming Webhooks** -> turn On.
3. **OAuth & Permissions -> Redirect URLs** -> add `http://localhost:4000/slack/callback`
   (if Slack rejects http, run `ngrok http 4000`, set `BACKEND_URL` to the https URL and register that instead).
   The app requests the `incoming-webhook` scope; the user picks the channel on Slack's consent screen.
4. Copy Client ID/Secret into `backend/.env`.

## 5. Run
```bash
cd backend && cp .env.example .env   # fill GOOGLE_* and SLACK_*
npm install && npm run dev           # http://localhost:4000

cd ../frontend && cp .env.local.example .env.local
npm install && npm run dev           # http://localhost:3000
```
First boot creates the tables, the Elasticsearch index, and `SENDER_COUNT` Ethereal sender accounts (needs internet).

## 6. Using it
1. Open http://localhost:3000 -> **Login with Google** -> dashboard. The sidebar shows your avatar, name and email; click it for **Log out**.
   (The email/password fields follow the Figma but are not enabled, since the brief asks for Google login only.)
2. Sidebar **Scheduled** / **Sent** tabs with live counts. Click a row to open the email (body, sender, status, Ethereal preview link). Search uses Elasticsearch; the filter icon filters by status; refresh reloads.
3. **Compose** opens a full page (as in the Figma): choose **From** (one sender or rotate across all), add recipients by typing or **Upload List** (CSV/txt; chips show the first 3 plus `+N`), subject, **Delay between 2 emails** (seconds), **Hourly Limit**, and a rich-text body.
   - **Send** starts immediately. **Send Later** opens the date/time popover (quick picks: tomorrow 10:00, 11:00, 15:00); **Done** schedules.
4. Optional: **Connect Slack** card at the bottom of the sidebar.
5. Live queue view: http://localhost:4000/admin/queues (bull-board).

Sample leads file (`leads.csv`):
```
email
a@example.com
b@example.com
c@example.com
```

## 7. Demo checklist
- **Restart safety:** schedule 5 mails 10 minutes out, stop the backend (Ctrl+C), start it again. Log shows `[reconcile] ...`; mails still go out at the scheduled time, once each.
- **Rate limit + Slack:** set hourly limit = 2 in the compose form, schedule 6 mails with delay 1s and `SENDER_COUNT=1`. After 2 sends the rest move to the next hour window (visible in bull-board "Delayed" and in the Scheduled tab), and Slack receives one message.
- **Not connected to Slack:** same scenario; nothing is posted and nothing crashes. Connect later and the next limit hit notifies (no redeploy, the lookup is per event).

## 8. Design notes

| Requirement | How it is done |
|---|---|
| No cron | BullMQ delayed jobs (`delay = scheduled_at - now`). |
| Persistence | Jobs live in Redis (AOF on). Postgres is the source of truth; `reconcile()` runs once at boot and re-adds any `scheduled` row whose job is missing. |
| Idempotency | `jobId = emailId` (re-adding is a no-op) **and** the worker claims the row with `UPDATE ... WHERE status='scheduled'`. Replays/duplicates see 0 rows and exit. SMTP `Message-ID` is also fixed per email. |
| Worker concurrency | `WORKER_CONCURRENCY` (default 5). |
| Min delay between sends | BullMQ worker `limiter {max:1, duration: MIN_DELAY_BETWEEN_EMAILS_MS}` (default **2000 ms**, global across workers because it is stored in Redis). The compose form's per-batch delay spaces `scheduled_at` values on top of this. |
| Hourly limit | Redis counter `rate:{sender}:{hourWindow}` updated by a Lua script (atomic INCR + EXPIRE + rollback on overflow), safe across workers/instances. Limit = form value, falling back to `MAX_EMAILS_PER_HOUR_PER_SENDER`. |
| Limit reached | Job is **not** failed or dropped: `job.moveToDelayed(nextHourStart + n*minDelay)`; `n` comes from a Redis overflow counter so overflow jobs keep roughly their original order. Row's `scheduled_at` is updated. |
| 1000+ at once | `addBulk` in one call; schedule time is pre-planned per sender (round-robin) so nothing is attempted above the quota; the limiter smooths bursts; the runtime Redis check is the safety net for concurrent batches. |
| Slack | Per-user incoming webhook stored after OAuth. Message sent once per user+sender+hour window (`SET NX`). No connection = silent skip. |
| Search | Every create/status change is indexed into Elasticsearch (`emails` index); `/api/search`-style querying is exposed via `GET /api/emails?q=`. |

Trade-offs: fixed-window counters allow a burst at a window boundary (a sliding window costs more Redis ops);
if the process dies after SMTP accepted a message but before the DB update, a stalled-job retry could re-send once (exactly-once over SMTP is not possible; the stable Message-ID lets receivers dedupe).
`/admin/queues` is unauthenticated for the demo; put it behind auth in production.

## 9. API
`GET /auth/google` · `POST /auth/logout` · `GET /api/me` · `POST /api/schedule` · `GET /api/emails?status=scheduled|sent&q=` ·
`GET /api/emails/:id` · `GET /api/counts` · `GET /api/senders` · `GET /api/slack` · `GET /api/slack/url` · `DELETE /api/slack` · `GET /slack/callback` · `GET /admin/queues`

`POST /api/schedule` body: `{subject, body (HTML), recipients[], startTime (ISO), delaySeconds, hourlyLimit?, senderId?}`

import { Pool } from 'pg';
import { cfg } from './config';
export const pool = new Pool({ connectionString: cfg.databaseUrl });

export async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL, name TEXT, avatar TEXT,
      created_at TIMESTAMPTZ DEFAULT now());
    CREATE TABLE IF NOT EXISTS senders (
      id SERIAL PRIMARY KEY, email TEXT NOT NULL, smtp_user TEXT NOT NULL, smtp_pass TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS slack_connections (
      user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      webhook_url TEXT NOT NULL, channel TEXT, team TEXT, connected_at TIMESTAMPTZ DEFAULT now());
    CREATE TABLE IF NOT EXISTS emails (
      id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id),
      sender_id INT NOT NULL REFERENCES senders(id),
      recipient TEXT NOT NULL, subject TEXT NOT NULL, body TEXT NOT NULL,
      scheduled_at TIMESTAMPTZ NOT NULL, sent_at TIMESTAMPTZ,
      status TEXT NOT NULL DEFAULT 'scheduled',
      hourly_limit INT, error TEXT, preview_url TEXT, created_at TIMESTAMPTZ DEFAULT now());
    CREATE INDEX IF NOT EXISTS emails_user_status ON emails(user_id, status, scheduled_at);
  `);
}

import 'dotenv/config';
const n = (v: string | undefined, d: number) => (v && !isNaN(+v) ? +v : d);
export const cfg = {
  port: n(process.env.PORT, 4000),
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  backendUrl: process.env.BACKEND_URL || 'http://localhost:4000',
  jwtSecret: process.env.JWT_SECRET || 'dev-secret',
  databaseUrl: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/scheduler',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  elasticUrl: process.env.ELASTIC_URL || 'http://localhost:9200',
  concurrency: n(process.env.WORKER_CONCURRENCY, 5),
  minDelayMs: n(process.env.MIN_DELAY_BETWEEN_EMAILS_MS, 2000),
  maxPerHour: n(process.env.MAX_EMAILS_PER_HOUR_PER_SENDER, 50),
  senderCount: n(process.env.SENDER_COUNT, 3),
  google: { id: process.env.GOOGLE_CLIENT_ID || '', secret: process.env.GOOGLE_CLIENT_SECRET || '' },
  slack: { id: process.env.SLACK_CLIENT_ID || '', secret: process.env.SLACK_CLIENT_SECRET || '' },
};
export const HOUR_MS = 3600_000;

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { cfg } from './config';
import { initDb } from './db';
import { initSearch } from './search';
import { ensureSenders } from './mailer';
import { emailQueue } from './queue';
import { startWorker, reconcile } from './worker';
import { authRouter } from './auth';
import { api, slackCallback } from './routes';

async function main() {
  await initDb();
  await initSearch();
  await ensureSenders();

  const app = express();
  app.use(cors({ origin: cfg.frontendUrl, credentials: true }));
  app.use(express.json({ limit: '10mb' }));
  app.use(cookieParser());

  const board = new ExpressAdapter();
  board.setBasePath('/admin/queues');
  createBullBoard({ queues: [new BullMQAdapter(emailQueue) as any], serverAdapter: board });
  app.use('/admin/queues', board.getRouter()); // live BullMQ dashboard

  app.get('/health', (_q, r) => r.json({ ok: true }));
  app.use('/auth', authRouter);
  app.use('/slack', slackCallback);
  app.use('/api', api);

  await reconcile();
  startWorker();
  app.listen(cfg.port, () => console.log(`API on ${cfg.backendUrl} | queue UI: ${cfg.backendUrl}/admin/queues`));
}
main().catch((e) => { console.error(e); process.exit(1); });

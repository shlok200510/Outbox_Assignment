import { Queue } from 'bullmq';
import { connection } from './redis';
export const QUEUE_NAME = 'emails';
export const emailQueue = new Queue(QUEUE_NAME, {
  connection,
  defaultJobOptions: { attempts: 3, backoff: { type: 'exponential', delay: 5000 }, removeOnComplete: 2000, removeOnFail: 5000 },
});

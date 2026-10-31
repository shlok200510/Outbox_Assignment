import IORedis from 'ioredis';
import { cfg } from './config';
export const connection = new IORedis(cfg.redisUrl, { maxRetriesPerRequest: null });

// Atomic fixed-window counter shared by every worker/instance.
// Returns true if a send slot was granted, false if the hourly limit is reached.
const LUA = `
local c = redis.call('INCR', KEYS[1])
if c == 1 then redis.call('EXPIRE', KEYS[1], ARGV[1]) end
if c > tonumber(ARGV[2]) then redis.call('DECR', KEYS[1]) return 0 end
return 1`;
export async function takeSlot(senderId: number, windowIdx: number, limit: number) {
  return (await connection.eval(LUA, 1, `rate:${senderId}:${windowIdx}`, 7200, limit)) === 1;
}

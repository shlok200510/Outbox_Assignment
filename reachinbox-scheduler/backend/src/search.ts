import { Client } from '@elastic/elasticsearch';
import { cfg } from './config';
const es = new Client({ node: cfg.elasticUrl });
const INDEX = 'emails';
const doc = (r: any) => ({ user_id: r.user_id, recipient: r.recipient, subject: r.subject, body: String(r.body).replace(/<[^>]+>/g, ' '),
  status: r.status, scheduled_at: r.scheduled_at, sent_at: r.sent_at });

export async function initSearch() {
  try {
    if (!(await es.indices.exists({ index: INDEX })))
      await es.indices.create({ index: INDEX, mappings: { properties: {
        user_id: { type: 'keyword' }, status: { type: 'keyword' }, recipient: { type: 'text' },
        subject: { type: 'text' }, body: { type: 'text' }, scheduled_at: { type: 'date' }, sent_at: { type: 'date' } } } });
  } catch (e) { console.warn('[search] init failed (continuing without ES):', (e as Error).message); }
}
export async function indexEmail(row: any) {
  try { await es.index({ index: INDEX, id: row.id, document: doc(row) }); }
  catch (e) { console.warn('[search] index failed:', (e as Error).message); }
}
export async function bulkIndex(rows: any[]) {
  if (!rows.length) return;
  try { await es.bulk({ operations: rows.flatMap((r) => [{ index: { _index: INDEX, _id: r.id } }, doc(r)]) }); }
  catch (e) { console.warn('[search] bulk failed:', (e as Error).message); }
}
export async function searchEmails(userId: string, q: string, statuses: string[]) {
  const r = await es.search({ index: INDEX, size: 100, query: { bool: {
    filter: [{ term: { user_id: userId } }, { terms: { status: statuses } }],
    must: [{ multi_match: { query: q, fields: ['recipient', 'subject', 'body'], fuzziness: 'AUTO' } }] } } });
  return r.hits.hits.map((h) => ({ id: h._id as string }));
}

import { db } from './desk-db.ts';
import { hashValue, IntakeError, sessionToken } from './estimate-http.ts';
import type { EstimateDraft, JobAssessment, JobPricing } from './job-estimate.ts';

export async function reserveAiCall(req: Request, secret: string) {
  const session = sessionToken(req);
  if (!session) throw new IntakeError('Please refresh the page before using the estimator.', 403);
  const now = Date.now();
  // Cloudflare supplies this IP header. No customer content or raw IP is persisted in the limit table.
  const actor = await hashValue(`${secret}:${req.headers.get('cf-connecting-ip') || session}`);
  const hour = Math.floor(now / 3600000); const day = Math.floor(now / 86400000);
  const reserve = (key: string, limit: number) => db().prepare('INSERT INTO ai_usage_limits (key,count,expires_at) VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1 WHERE count<? RETURNING count').bind(key, now + 2 * 86400000, limit);
  const results = await db().batch([reserve(`actor:${actor}:${hour}`, 12), reserve(`global:${day}`, 200)]);
  if (results.some(r => r.results.length === 0)) throw new IntakeError('The estimator has reached its request limit. You can still send your details for AVL to review.', 429);
  await db().prepare('DELETE FROM ai_usage_limits WHERE expires_at<?').bind(now).run();
  return hashValue(session);
}

export type StoredEstimate = { id: string; session_hash: string; assessment_json: string; pricing_json: string; draft_json: string; load_id: number | null; expires_at: string };
export async function estimateForRequest(req: Request, id: string, draft: Omit<EstimateDraft, 'roadMiles'>) {
  const token = sessionToken(req);
  const row = token ? await db().prepare('SELECT * FROM job_estimates WHERE id=? AND session_hash=? AND (expires_at>? OR load_id IS NOT NULL)').bind(id, await hashValue(token), new Date().toISOString()).first<StoredEstimate>() : null;
  if (!row) throw new IntakeError('This estimate has expired or was already used. Recalculate it, or send a request without an estimate.', 409);
  const original = JSON.parse(row.draft_json) as EstimateDraft;
  for (const key of ['title', 'category', 'description', 'origin', 'destination', 'carryHelp'] as const) {
    if (draft[key].trim() !== original[key].trim()) throw new IntakeError('The delivery details changed after estimating. Please recalculate or send them for a fresh AVL review.', 409);
  }
  return row;
}
export async function loadJobEstimate(id: string | null) {
  if (!id) return null;
  const row = await db().prepare('SELECT assessment_json,pricing_json,model,prompt_version,created_at FROM job_estimates WHERE id=?').bind(id).first<{ assessment_json: string; pricing_json: string; model: string; prompt_version: string; created_at: string }>();
  if (!row) return null;
  return { assessment: JSON.parse(row.assessment_json) as JobAssessment, pricing: JSON.parse(row.pricing_json) as JobPricing, model: row.model, promptVersion: row.prompt_version, createdAt: row.created_at };
}

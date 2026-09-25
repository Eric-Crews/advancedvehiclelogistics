import { NextResponse } from 'next/server';
import { db } from '@/lib/desk-db';
import { assessDelivery, AssessmentError } from '@/lib/openai-delivery';
import { estimateDraft, getEstimatePolicy, intakeSchema, JOB_PROMPT_VERSION, priceJob } from '@/lib/job-estimate';
import { boundedBody, ESTIMATE_COOKIE, IntakeError, requireSameOrigin, sessionToken } from '@/lib/estimate-http';
import { reserveAiCall } from '@/lib/estimate-store';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const response = NextResponse.json({ available: Boolean(process.env.OPENAI_API_KEY), minimumJobCents: 6000 }, { headers: { 'Cache-Control': 'no-store' } });
  if (!sessionToken(req)) response.cookies.set(ESTIMATE_COOKIE, crypto.randomUUID(), { httpOnly: true, secure: new URL(req.url).protocol === 'https:', sameSite: 'lax', path: '/', maxAge: 7 * 86400 });
  return response;
}
export async function POST(req: Request) {
  try {
    requireSameOrigin(req);
    if (!req.headers.get('content-type')?.includes('application/json')) throw new IntakeError('Send the delivery details as JSON.', 415);
    const bytes = await boundedBody(req, 16000);
    let raw: unknown; try { raw = JSON.parse(new TextDecoder().decode(bytes)); } catch { throw new IntakeError('Please check your delivery details.'); }
    const parsed = intakeSchema.safeParse(raw);
    if (!parsed.success) throw new IntakeError('Describe the item and handling needs in at least 20 characters. Check the locations and mileage too.');
    const key = process.env.OPENAI_API_KEY;
    if (!key) throw new IntakeError('Online estimates are not available yet. Send your details and AVL will work through the price with you.', 503);
    const policy = getEstimatePolicy(process.env.AVL_ESTIMATE_POLICY);
    const sessionHash = await reserveAiCall(req, key);
    const model = process.env.OPENAI_ESTIMATE_MODEL || 'gpt-5-mini';
    const assessment = await assessDelivery(parsed.data, key, model);
    const pricing = priceJob(assessment, policy);
    const draft = estimateDraft(assessment, parsed.data, pricing);
    const id = crypto.randomUUID(), createdAt = new Date().toISOString(), expiresAt = new Date(Date.now() + 2 * 86400000).toISOString();
    await db().prepare('INSERT INTO job_estimates (id,session_hash,input_json,assessment_json,pricing_json,draft_json,model,prompt_version,policy_version,created_at,expires_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)').bind(id, sessionHash, JSON.stringify(parsed.data), JSON.stringify(assessment), JSON.stringify(pricing), JSON.stringify(draft), model, JOB_PROMPT_VERSION, policy.version, createdAt, expiresAt).run();
    await db().prepare('DELETE FROM job_estimates WHERE load_id IS NULL AND expires_at<?').bind(new Date(Date.now() - 7 * 86400000).toISOString()).run();
    const { costs, ...publicPricing } = pricing;
    void costs; // Internal cost and margin details never enter the customer response.
    return NextResponse.json({ id, assessment, pricing: publicPricing, draft, expiresAt }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    const known = error instanceof IntakeError || error instanceof AssessmentError;
    return NextResponse.json({ error: known ? error.message : 'The estimator is temporarily unavailable. Your details are still here; ask AVL to review them.' }, { status: known ? error.status : 503, headers: { 'Cache-Control': 'no-store' } });
  }
}

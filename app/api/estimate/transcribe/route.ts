import { NextResponse } from 'next/server';
import { AssessmentError, transcribeDelivery } from '@/lib/openai-delivery';
import { boundedBody, IntakeError, requireSameOrigin, validRecording } from '@/lib/estimate-http';
import { reserveAiCall } from '@/lib/estimate-store';
export const dynamic = 'force-dynamic';
export async function POST(req: Request) {
  try {
    requireSameOrigin(req);
    const key = process.env.OPENAI_API_KEY;
    if (!key) throw new IntakeError('Voice transcription is not available yet. Please type your delivery details.', 503);
    const contentType = req.headers.get('content-type') || '';
    if (!contentType.startsWith('multipart/form-data')) throw new IntakeError('Please record a new voice note.', 415);
    const body = await boundedBody(req, 4 * 1024 * 1024 + 16000);
    const form = await new Response(body, { headers: { 'Content-Type': contentType } }).formData();
    const file = form.get('audio');
    if (!validRecording(file)) throw new IntakeError('Use a short WebM, MP4, WAV, or MP3 recording under 4 MB.');
    await reserveAiCall(req, key);
    const text = await transcribeDelivery(file, key, process.env.OPENAI_TRANSCRIBE_MODEL || 'gpt-transcribe');
    return NextResponse.json({ text }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    const known = error instanceof IntakeError || error instanceof AssessmentError;
    return NextResponse.json({ error: known ? error.message : 'We could not transcribe that recording. Please try again or type your request.' }, { status: known ? error.status : 503, headers: { 'Cache-Control': 'no-store' } });
  }
}

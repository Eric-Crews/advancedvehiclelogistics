export const ESTIMATE_COOKIE = 'avl_estimate_session';
export class IntakeError extends Error {
  status: number;
  constructor(message: string, status = 400) { super(message); this.status = status; }
}
export function requireSameOrigin(req: Request) {
  const origin = req.headers.get('origin');
  if (!origin || origin !== new URL(req.url).origin) throw new IntakeError('Open the estimator on the AVL website to continue.', 403);
}
export function sessionToken(req: Request): string | null {
  const value = req.headers.get('cookie')?.split(';').map(s => s.trim()).find(s => s.startsWith(`${ESTIMATE_COOKIE}=`))?.slice(ESTIMATE_COOKIE.length + 1);
  return value && /^[a-f\d-]{36}$/i.test(value) ? value : null;
}
export async function hashValue(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
}
export async function boundedBody(req: Request, maximum: number): Promise<ArrayBuffer> {
  const length = Number(req.headers.get('content-length'));
  if (length > maximum) throw new IntakeError('That request is too large. Please shorten it.', 413);
  const reader = req.body?.getReader();
  if (!reader) throw new IntakeError('Add your delivery details first.');
  const chunks: Uint8Array[] = []; let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read(); if (done) break;
      size += value.byteLength;
      if (size > maximum) { await reader.cancel(); throw new IntakeError('That request is too large. Please shorten it.', 413); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const body = new Uint8Array(size); let offset = 0;
  for (const chunk of chunks) { body.set(chunk, offset); offset += chunk.byteLength; }
  return body.buffer;
}

export function validRecording(file: unknown): file is File {
  if (!(file instanceof File) || file.size < 100 || file.size > 4 * 1024 * 1024) return false;
  return ['audio/webm', 'video/webm', 'audio/mp4', 'video/mp4', 'audio/wav', 'audio/x-wav', 'audio/mpeg'].includes(file.type.split(';')[0]);
}

import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_POLICY, assessmentSchema, priceJob, getEstimatePolicy, estimateDraft } from '../lib/job-estimate.ts';
import { priceRange } from '../lib/estimate-display.ts';
import { assessDelivery, parseAssessmentResponse, transcribeDelivery } from '../lib/openai-delivery.ts';
import { boundedBody, requireSameOrigin, sessionToken, validRecording } from '../lib/estimate-http.ts';

const couch = {
  title: 'Couch delivery', summary: 'Two movers carry a couch down three flights and deliver it two miles to a ground-floor home.', category: 'furniture',
  items: [{ name: 'Couch', quantity: 1, bulky: true, weightLbs: 180, longestSideFt: 7 }],
  origin: 'Pickup in Seattle, WA', destination: 'Home in Seattle, WA', routeScope: 'local', deliveryMiles: 2, drivingMinutes: 10,
  pickupStairs: 3, deliveryStairs: 0, pickupElevator: false, deliveryElevator: false, longCarry: false,
  crewSize: 2, loadingMinutes: { low: 44, high: 66 }, unloadingMinutes: { low: 20, high: 30 }, disassembly: 'none', specialRequirements: [], assumptions: [], questions: [],
};
const completed = (value = couch) => ({ status: 'completed', output: [{ type: 'message', content: [{ type: 'output_text', text: JSON.stringify(value) }] }] });

test('two-mile, three-flight couch delivery pays both people for time and clears the $60 floor', () => {
  const result = priceJob(couch);
  assert.equal(result.crewSize, 2); assert.equal(result.status, 'range');
  assert.ok(result.lowCents >= 6000); assert.ok(result.lowCents > 450);
  assert.equal(result.costs.laborLowCents, result.paidMinutes.low / 60 * 2 * 3000);
  assert.ok(result.paidMinutes.low >= 120); assert.ok(result.highCents >= result.lowCents);
  console.log('Couch example:', priceRange(result), result.paidMinutes, 'paid minutes per worker');
});
test('stairs increase the estimate for the same item and route', () => {
  const ground = priceJob({ ...couch, pickupStairs: 0, loadingMinutes: { low: 20, high: 30 } });
  assert.ok(priceJob(couch).lowCents > ground.lowCents);
});
test('model underestimation cannot waive bulky-item crew and minimum handling time', () => {
  const result = priceJob({ ...couch, crewSize: 1, loadingMinutes: { low: 0, high: 0 }, unloadingMinutes: { low: 0, high: 0 } });
  assert.equal(result.crewSize, 2); assert.ok(result.handlingMinutes.low >= 64);
  assert.ok(result.lowCents >= DEFAULT_POLICY.minimumJobCents);
});
test('known large items and specialist jobs never receive an instant numeric range', () => {
  for (const change of [{ specialRequirements: ['piano'] }, { items: [{ ...couch.items[0], longestSideFt: 40 }] }, { crewSize: 3 }, { deliveryMiles: 150 }, { routeScope: 'long_distance' }]) {
    const result = priceJob({ ...couch, ...change });
    assert.equal(result.status, 'review_required'); assert.equal(result.lowCents, null); assert.equal(result.highCents, null);
  }
});
test('unknown travel is never presented as a verified route', () => {
  const local = priceJob({ ...couch, deliveryMiles: null });
  assert.equal(local.mileageBasis, 'local_allowance'); assert.ok(local.assumptions.some(a => a.includes('10 driving miles')));
  const unknown = priceJob({ ...couch, deliveryMiles: null, routeScope: 'unknown' });
  assert.equal(unknown.lowCents, null); assert.equal(unknown.mileageBasis, 'unknown');
});
test('missing access widens uncertainty and asks questions; it is not zero stairs', () => {
  const result = priceJob({ ...couch, pickupStairs: null, deliveryStairs: null, longCarry: null });
  assert.ok(result.questions.some(q => q.includes('flights'))); assert.ok(result.assumptions.some(a => a.includes('Unknown access')));
});
test('configured minimum, worker pay, and margin are honored and invalid policies rejected', () => {
  const base = priceJob(couch);
  assert.ok(priceJob(couch, { ...DEFAULT_POLICY, workerHourlyCostCents: 4500 }).lowCents > base.lowCents);
  assert.ok(priceJob(couch, { ...DEFAULT_POLICY, marginBps: 3000 }).lowCents > base.lowCents);
  assert.ok(priceJob(couch, { ...DEFAULT_POLICY, minimumJobCents: 50000 }).lowCents >= 50000);
  assert.throws(() => getEstimatePolicy('{"minimumJobCents":100}'));
  assert.throws(() => getEstimatePolicy('{"marginBps":9900}'));
});
test('structured data rejects missing keys, extra price instructions, negative dimensions, and reversed times', () => {
  assert.equal(assessmentSchema.safeParse(couch).success, true);
  for (const value of [{}, { ...couch, quoteCents: 500 }, { ...couch, pickupStairs: -1 }, { ...couch, loadingMinutes: { low: 40, high: 5 } }]) assert.equal(assessmentSchema.safeParse(value).success, false);
});
test('refused, truncated, malformed, and schema-invalid AI results cannot create estimates', () => {
  assert.deepEqual(parseAssessmentResponse(completed()), couch);
  for (const value of [{ status: 'incomplete', output: completed().output }, { status: 'completed', output: [{ type: 'message', content: [{ type: 'refusal' }] }] }, completed({ title: 'incomplete' }), { status: 'completed', output: [{ type: 'message', content: [{ type: 'output_text', text: 'not JSON' }] }] }]) assert.throws(() => parseAssessmentResponse(value));
});
test('Responses request uses strict schema and explicit form details override narrative extraction', async () => {
  const input = { description: 'Move a couch down three flights of stairs.', origin: 'Explicit pickup', destination: 'Explicit dropoff', miles: 8 };
  const result = await assessDelivery(input, 'test-only-key', 'gpt-5-mini', async (url, options) => {
    assert.equal(url, 'https://api.openai.com/v1/responses');
    const body = JSON.parse(options.body); assert.equal(body.store, false); assert.equal(body.text.format.strict, true); assert.equal(body.text.format.schema.additionalProperties, false);
    assert.equal(body.input, JSON.stringify(input)); return Response.json(completed());
  });
  assert.equal(result.origin, input.origin); assert.equal(result.destination, input.destination); assert.equal(result.deliveryMiles, 8);
  const draft = estimateDraft(result, input, priceJob(result)); assert.equal(draft.description, input.description); assert.equal(draft.carryHelp, 'two_people');
});
test('provider errors are reported without leaking response bodies or keys', async () => {
  await assert.rejects(() => assessDelivery({ description: 'A couch delivery', origin: '', destination: '', miles: null }, 'test-only-key', 'gpt-5-mini', async () => new Response('sensitive vendor error', { status: 401 })), /temporarily unavailable/);
});
test('voice recording stays a separate transcription step', async () => {
  const file = new File([new Uint8Array(200)], 'delivery.webm', { type: 'audio/webm' });
  assert.equal(validRecording(file), true); assert.equal(validRecording(new File(['bad'], 'bad.html', { type: 'text/html' })), false);
  const text = await transcribeDelivery(file, 'test-only-key', 'gpt-transcribe', async (url, options) => {
    assert.ok(url.endsWith('/audio/transcriptions')); assert.equal(options.body.get('file').name, 'delivery.webm');
    assert.equal(options.body.get('model'), 'gpt-transcribe'); return Response.json({ text: 'Please move my couch downstairs.' });
  });
  assert.equal(text, 'Please move my couch downstairs.');
});
test('cross-origin calls and oversized streaming bodies are rejected', async () => {
  const url = 'https://avl.example/api/estimate';
  assert.throws(() => requireSameOrigin(new Request(url, { headers: { origin: 'https://other.example' } })));
  assert.doesNotThrow(() => requireSameOrigin(new Request(url, { headers: { origin: 'https://avl.example' } })));
  assert.equal(sessionToken(new Request(url, { headers: { cookie: 'avl_estimate_session=invalid' } })), null);
  await assert.rejects(() => boundedBody(new Request(url, { method: 'POST', body: 'x'.repeat(100) }), 20), /too large/);
});

# Delivery assessment and pricing

The approved AVL design is unchanged. The entry point now accepts a typed description or a microphone recording. A recording is held in the browser until the customer chooses to transcribe it. The transcript is editable before estimating. AVL does not persist raw recordings.

## Boundaries

OpenAI extracts the job into strict JSON: items, quantities, explicit dimensions/weights, locations, reported miles, stairs, elevators, carrying access, crew, handling-time ranges, specialist needs, assumptions, and confirmation questions. It never supplies a price or carrier availability. Unknown facts remain null. Inferred handling times are planning estimates, not measurements.

`lib/openai-delivery.ts` contains the versioned prompt and Responses API call. `lib/job-estimate.ts` defines the JSON schema, runtime validation, and pricing policy. `lib/estimate-display.ts` is the customer-safe display helper.

## Pricing formula

1. Enforce at least two professional workers for bulky items such as couches. Do not substitute unconfirmed customer lifting for paid labor.
2. Paid time per worker includes approach, 10 minutes of setup/coordination, pickup handling, delivery driving, drop-off handling, and wrap-up/repositioning. Round up to 15 minutes, with at least 60 paid minutes.
3. Use the higher of AI handling time and minimum handling allowances derived from stairs, quantity, and bulk. Do not add the same stair allowance twice. Unconfirmed elevator fit does not remove stated stairs.
4. Cost = crew × paid hours × worker cost + vehicle allowance + coordination cost.
5. Customer price = (cost + fixed processing allowance) / (1 − target margin − processing percentage). Round up to $5 and enforce the $60 job minimum.

Initial business assumptions, **not market wage data or guaranteed contractor costs**:

| Setting | Default |
| --- | --- |
| Job minimum | $60 |
| Loaded worker cost | $30 per worker per hour |
| Approach allowance | 20–40 minutes |
| Wrap-up/repositioning | 10–20 minutes |
| Vehicle operating allowance | Higher of $10 or $1.25 per delivery mile |
| Coordination cost | $5 |
| Target contribution margin | 20% |
| Processing allowance | 3% + $0.30 |

Actual regional labor, provider cost, parking, tolls, traffic, equipment, and taxes where applicable require review. No real carrier quote or maps API is connected. Explicit customer miles are marked unverified. If the customer explicitly describes a local job but gives no miles, the range clearly assumes up to 10 delivery miles. Unknown routes, more than 75 miles, specialist jobs, oversized/heavy items, or larger crews require custom review without a numeric range.

## Activation

Set `OPENAI_API_KEY` as a **server secret** in Sites and deploy. Never use a `NEXT_PUBLIC_` key. Optional server configuration:

- `OPENAI_ESTIMATE_MODEL` (default `gpt-5-mini`)
- `OPENAI_TRANSCRIBE_MODEL` (default `gpt-transcribe`)
- `AVL_ESTIMATE_POLICY`: JSON overrides merged with the defaults and validated. Example: `{"version":"avl-reviewed-rates-v2","workerHourlyCostCents":3500,"minimumJobCents":7500,"marginBps":2000}`. Coordinate public minimum-price copy if changing the default minimum.

Without a key, the UI states that online estimates are being set up and lets customers submit for human review. There is no simulated AI response or keyword-based fallback presented as AI.

## Saved assessment and phone review

Estimates are saved server-side, linked to an opaque HttpOnly session cookie, and valid for attaching to a request for 48 hours. Customer requests send the estimate ID, not trusted prices or internal costs. The server verifies ownership and unchanged core details. Edits to job details in the form invalidate the current estimate. A unique database constraint prevents using one estimate for multiple requests. Unlinked expired assessments are cleaned up after an additional seven days when new estimates are made.

The quote desk displays the original description, extracted facts, range, private cost calculation, and questions. The owner records a confirmation call and the actual scope before sending an AI-assisted quote. The server enforces this for quoting and booking; legacy quote endpoints direct these jobs to the quote desk. Confirmed provider cost and availability still govern the final quote. An estimate never books or charges anyone.

## Operational limits and calibration

AI calls are limited to 12 per actor per hour and 200 per day across this Site, shared by assessment and transcription. Limits are atomic database counters, not process memory. Actor IPs are hashed with a secret before counting; raw IPs are not stored in the limiter. A global limit remains effective when a client resets cookies. Recording UI stops at 60 seconds; the server enforces a 4 MB audio-file limit. JSON request bodies, result sizes, and provider calls are bounded. Responses are not stored by the Responses API (`store:false`); this is not a claim of zero retention across OpenAI services.

Before treating ranges as accurate, compare assessment time and cost with completed jobs: crew count, actual paid time, approach, handling, stairs, vehicle, and fulfilled-provider price. Change the versioned policy and prompt against those observations. Current tests validate rules and failure handling with provider responses mocked; they do not establish live AI accuracy.

## Verification

`node --experimental-strip-types --test tests/job-estimate.test.mjs`

Official integration references:

- https://developers.openai.com/api/docs/guides/structured-outputs
- https://developers.openai.com/api/docs/guides/speech-to-text
- https://developers.openai.com/api/docs/models/gpt-5-mini

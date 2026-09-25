import { z } from 'zod';

export const JOB_PROMPT_VERSION = 'avl-intake-1';
const shortText = z.string().trim().min(1).max(240);
const minutes = z.object({ low: z.number().int().min(0).max(480), high: z.number().int().min(0).max(480) }).strict().refine(v => v.high >= v.low, 'Time range is reversed');
export const assessmentSchema = z.object({
  title: z.string().trim().min(3).max(140),
  summary: z.string().trim().min(10).max(600),
  category: z.enum(['furniture', 'marketplace', 'lumber', 'landscaping', 'appliance', 'other']),
  items: z.array(z.object({ name: shortText, quantity: z.number().int().min(1).max(1000), bulky: z.boolean(), weightLbs: z.number().positive().max(200000).nullable(), longestSideFt: z.number().positive().max(100).nullable() }).strict()).min(1).max(12),
  origin: z.string().trim().min(3).max(200).nullable(),
  destination: z.string().trim().min(3).max(200).nullable(),
  routeScope: z.enum(['local', 'regional', 'long_distance', 'unknown']),
  deliveryMiles: z.number().positive().max(10000).nullable(),
  drivingMinutes: z.number().positive().max(1440).nullable(),
  pickupStairs: z.number().int().min(0).max(30).nullable(),
  deliveryStairs: z.number().int().min(0).max(30).nullable(),
  pickupElevator: z.boolean().nullable(),
  deliveryElevator: z.boolean().nullable(),
  longCarry: z.boolean().nullable(),
  crewSize: z.number().int().min(1).max(4),
  loadingMinutes: minutes,
  unloadingMinutes: minutes,
  disassembly: z.enum(['none', 'simple', 'specialist', 'unknown']),
  specialRequirements: z.array(z.enum(['piano', 'safe', 'hoist', 'hazardous', 'installation', 'oversize', 'temperature_control', 'full_house_move', 'other_specialist'])).max(9),
  assumptions: z.array(shortText).max(8),
  questions: z.array(shortText).max(8),
}).strict();
export type JobAssessment = z.infer<typeof assessmentSchema>;

// Every field is required; unknown facts are null, never invented by the model.
const string = { type: 'string' };
const nullableNumber = { type: ['number', 'null'] };
const nullableBoolean = { type: ['boolean', 'null'] };
const range = { type: 'object', properties: { low: { type: 'integer' }, high: { type: 'integer' } }, required: ['low', 'high'], additionalProperties: false };
const properties = {
  title: string, summary: string, category: { type: 'string', enum: ['furniture', 'marketplace', 'lumber', 'landscaping', 'appliance', 'other'] },
  items: { type: 'array', items: { type: 'object', properties: { name: string, quantity: { type: 'integer' }, bulky: { type: 'boolean' }, weightLbs: nullableNumber, longestSideFt: nullableNumber }, required: ['name', 'quantity', 'bulky', 'weightLbs', 'longestSideFt'], additionalProperties: false } },
  origin: { type: ['string', 'null'] }, destination: { type: ['string', 'null'] },
  routeScope: { type: 'string', enum: ['local', 'regional', 'long_distance', 'unknown'] },
  deliveryMiles: nullableNumber, drivingMinutes: nullableNumber,
  pickupStairs: { type: ['integer', 'null'] }, deliveryStairs: { type: ['integer', 'null'] },
  pickupElevator: nullableBoolean, deliveryElevator: nullableBoolean, longCarry: nullableBoolean,
  crewSize: { type: 'integer' }, loadingMinutes: range, unloadingMinutes: range,
  disassembly: { type: 'string', enum: ['none', 'simple', 'specialist', 'unknown'] },
  specialRequirements: { type: 'array', items: { type: 'string', enum: ['piano', 'safe', 'hoist', 'hazardous', 'installation', 'oversize', 'temperature_control', 'full_house_move', 'other_specialist'] } },
  assumptions: { type: 'array', items: string }, questions: { type: 'array', items: string },
};
export const assessmentJsonSchema = { type: 'object', properties, required: Object.keys(properties), additionalProperties: false };

export const intakeSchema = z.object({
  description: z.string().trim().min(20).max(2600),
  origin: z.string().trim().max(200).default(''), destination: z.string().trim().max(200).default(''),
  miles: z.number().min(0.1).max(10000).nullable().default(null),
}).strict();
export type EstimateIntake = z.infer<typeof intakeSchema>;

export const policySchema = z.object({
  version: z.string().min(1).max(80), minimumJobCents: z.number().int().min(6000).max(50000),
  workerHourlyCostCents: z.number().int().min(1500).max(15000),
  minimumPaidMinutes: z.number().int().min(60).max(240),
  approachLowMinutes: z.number().int().min(10).max(120), approachHighMinutes: z.number().int().min(10).max(180),
  repositionLowMinutes: z.number().int().min(0).max(120), repositionHighMinutes: z.number().int().min(0).max(180),
  vehicleMinimumCents: z.number().int().min(0).max(20000), vehicleCentsPerMile: z.number().int().min(1).max(1000),
  coordinationCents: z.number().int().min(0).max(20000),
  marginBps: z.number().int().min(0).max(5000), processingBps: z.number().int().min(0).max(1000), processingFixedCents: z.number().int().min(0).max(200),
  localAllowanceMiles: z.number().int().min(1).max(30), maxInstantMiles: z.number().int().min(10).max(100),
}).strict().refine(p => p.approachHighMinutes >= p.approachLowMinutes && p.repositionHighMinutes >= p.repositionLowMinutes);
export type EstimatePolicy = z.infer<typeof policySchema>;
/** Initial operating assumptions, not surveyed wages or live carrier rates. */
export const DEFAULT_POLICY: EstimatePolicy = {
  version: 'avl-crew-time-v1', minimumJobCents: 6000, workerHourlyCostCents: 3000, minimumPaidMinutes: 60,
  approachLowMinutes: 20, approachHighMinutes: 40, repositionLowMinutes: 10, repositionHighMinutes: 20,
  vehicleMinimumCents: 1000, vehicleCentsPerMile: 125, coordinationCents: 500,
  marginBps: 2000, processingBps: 300, processingFixedCents: 30,
  localAllowanceMiles: 10, maxInstantMiles: 75,
};
export function getEstimatePolicy(config?: string): EstimatePolicy {
  return policySchema.parse(config ? { ...DEFAULT_POLICY, ...JSON.parse(config) } : DEFAULT_POLICY);
}

export type JobPricing = {
  policyVersion: string; status: 'range' | 'review_required'; lowCents: number | null; highCents: number | null;
  minimumJobCents: number; crewSize: number; paidMinutes: { low: number; high: number };
  handlingMinutes: { low: number; high: number }; deliveryMiles: number | null; mileageBasis: 'customer_reported' | 'local_allowance' | 'unknown';
  assumptions: string[]; questions: string[]; reviewReasons: string[];
  costs: { laborLowCents: number; laborHighCents: number; vehicleCents: number; coordinationCents: number; workerHourlyCostCents: number; marginBps: number; processingBps: number; processingFixedCents: number };
};
const roundQuarterHour = (n: number) => Math.ceil(n / 15) * 15;
export function priceJob(raw: JobAssessment, policy = DEFAULT_POLICY): JobPricing {
  const a = assessmentSchema.parse(raw);
  const p = policySchema.parse(policy);
  const bulky = a.items.some(i => i.bulky || (i.weightLbs ?? 0) > 70 || /\b(couch|sofa|sectional|refrigerator|washer|dryer|wardrobe)\b/i.test(i.name));
  const crewSize = Math.max(a.crewSize, bulky ? 2 : 1);
  const quantity = a.items.reduce((sum, i) => sum + i.quantity, 0);
  const reasons: string[] = [];
  if (a.specialRequirements.length) reasons.push('Special equipment or specialist handling needs an AVL review.');
  if (a.disassembly === 'specialist') reasons.push('Specialist disassembly needs a separate scope and price.');
  if (a.items.some(i => (i.weightLbs ?? 0) > 400 || (i.longestSideFt ?? 0) > 12)) reasons.push('Item weight or size needs a vehicle and handling check.');
  if (a.items.reduce((sum, i) => sum + (i.weightLbs ?? 0) * i.quantity, 0) > 1500) reasons.push('The reported total load weight needs a vehicle-capacity check.');
  if (crewSize > 2 || a.items.filter(i => i.bulky).reduce((n, i) => n + i.quantity, 0) > 4 || quantity > 80) reasons.push('A larger crew or load needs a custom delivery plan.');
  if (a.routeScope === 'regional' || a.routeScope === 'long_distance' || (a.deliveryMiles ?? 0) > p.maxInstantMiles) reasons.push('Longer routes need actual routing and provider availability.');
  const mileageBasis = a.deliveryMiles !== null ? 'customer_reported' : a.routeScope === 'local' ? 'local_allowance' : 'unknown';
  const distance = a.deliveryMiles ?? (mileageBasis === 'local_allowance' ? p.localAllowanceMiles : null);
  if (distance === null) reasons.push('We need to confirm the pickup-to-delivery route.');

  // Elevator fit is unverified. Stated stairs remain in the labor allowance until a call confirms an alternative.
  const handlingFloor = (stairs: number | null, high: boolean) => (bulky ? (high ? 30 : 20) : (high ? 15 : 10))
    + (stairs ?? (high ? 2 : 0)) * (bulky ? (high ? 12 : 8) : (high ? 5 : 3))
    + Math.min(120, Math.max(0, quantity - 1) * (high ? 3 : 2));
  const loadingLow = Math.max(a.loadingMinutes.low, handlingFloor(a.pickupStairs, false));
  const loadingHigh = Math.max(a.loadingMinutes.high, handlingFloor(a.pickupStairs, true));
  const unloadingLow = Math.max(a.unloadingMinutes.low, handlingFloor(a.deliveryStairs, false));
  const unloadingHigh = Math.max(a.unloadingMinutes.high, handlingFloor(a.deliveryStairs, true));
  const handlingLow = loadingLow + unloadingLow + (a.longCarry ? 15 : 0) + (a.disassembly === 'simple' ? 15 : 0);
  const handlingHigh = loadingHigh + unloadingHigh + (a.longCarry !== false ? 30 : 0) + (['simple', 'unknown'].includes(a.disassembly) ? 30 : 0);
  const driveLow = Math.max(10, a.drivingMinutes ?? 0, distance !== null ? distance / 25 * 60 : 0);
  const driveHigh = Math.max(driveLow, a.drivingMinutes !== null ? a.drivingMinutes * 1.3 : 0, distance !== null ? distance / 15 * 60 : 0);
  const paidLow = roundQuarterHour(Math.max(p.minimumPaidMinutes, p.approachLowMinutes + 10 + handlingLow + driveLow + p.repositionLowMinutes));
  const paidHigh = roundQuarterHour(Math.max(paidLow, p.approachHighMinutes + 10 + handlingHigh + driveHigh + p.repositionHighMinutes));
  const laborLowCents = Math.ceil(paidLow / 60 * crewSize * p.workerHourlyCostCents);
  const laborHighCents = Math.ceil(paidHigh / 60 * crewSize * p.workerHourlyCostCents);
  const vehicleCents = Math.max(p.vehicleMinimumCents, Math.ceil((distance ?? 0) * p.vehicleCentsPerMile));
  const retail = (labor: number) => Math.max(p.minimumJobCents, Math.ceil((labor + vehicleCents + p.coordinationCents + p.processingFixedCents) / (1 - (p.marginBps + p.processingBps) / 10000) / 500) * 500);
  const assumptions = [
    ...a.assumptions,
    `Includes ${p.approachLowMinutes}–${p.approachHighMinutes} minutes to reach pickup and ${p.repositionLowMinutes}–${p.repositionHighMinutes} minutes to finish and reposition.`,
    'Travel times are planning allowances, not live routing or traffic measurements.',
    ...(mileageBasis === 'local_allowance' ? [`Assumes a local delivery of up to ${p.localAllowanceMiles} driving miles. A longer route changes this estimate.`] : []),
    ...(mileageBasis === 'customer_reported' ? ['Mileage is customer-reported and has not been verified.'] : []),
    ...(a.pickupStairs === null || a.deliveryStairs === null ? ['Unknown access adds a handling allowance; stairs and elevator fit need confirmation.'] : []),
    'Regional labor costs, tolls, parking, vehicle fit, and provider availability are checked before the final quote.',
  ];
  const questions = [...new Set([
    ...(!a.origin || !a.destination ? ['What are the exact pickup and delivery addresses?'] : []),
    ...(a.pickupStairs === null || a.deliveryStairs === null ? ['How many flights of stairs are at pickup and delivery, and is there an elevator that fits the item?'] : []),
    ...(a.items.some(i => i.weightLbs === null || i.longestSideFt === null) ? ['What are the item dimensions and approximate weight?'] : []),
    ...(a.longCarry === null ? ['Can the vehicle park close to both entrances?'] : []), ...a.questions,
  ])].slice(0, 10);
  return {
    policyVersion: p.version, status: reasons.length ? 'review_required' : 'range',
    lowCents: reasons.length ? null : retail(laborLowCents), highCents: reasons.length ? null : retail(laborHighCents),
    minimumJobCents: p.minimumJobCents, crewSize, paidMinutes: { low: paidLow, high: paidHigh },
    handlingMinutes: { low: handlingLow, high: handlingHigh }, deliveryMiles: distance, mileageBasis,
    assumptions: [...new Set(assumptions)], questions, reviewReasons: reasons,
    costs: { laborLowCents, laborHighCents, vehicleCents, coordinationCents: p.coordinationCents, workerHourlyCostCents: p.workerHourlyCostCents, marginBps: p.marginBps, processingBps: p.processingBps, processingFixedCents: p.processingFixedCents },
  };
}
export type PublicPricing = Omit<JobPricing, 'costs'>;
export type EstimateDraft = { title: string; category: JobAssessment['category']; description: string; origin: string; destination: string; roadMiles: string; carryHelp: 'one_person' | 'two_people' };
export type PreparedEstimate = { id: string; assessment: JobAssessment; pricing: PublicPricing; draft: EstimateDraft; expiresAt: string };
export function estimateDraft(a: JobAssessment, input: EstimateIntake, pricing: JobPricing): EstimateDraft {
  return { title: a.title, category: a.category, description: input.description, origin: input.origin || a.origin || '', destination: input.destination || a.destination || '', roadMiles: input.miles?.toString() ?? a.deliveryMiles?.toString() ?? '', carryHelp: pricing.crewSize > 1 ? 'two_people' : 'one_person' };
}

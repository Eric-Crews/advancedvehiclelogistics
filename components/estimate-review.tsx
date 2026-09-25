'use client';
import { useState, type FormEvent } from 'react';
import { Phone, ClipboardCheck } from 'lucide-react';
import type { JobAssessment, JobPricing } from '@/lib/job-estimate';
import { priceRange } from '@/lib/estimate-display';

export type DeskEstimate = { assessment: JobAssessment; pricing: JobPricing; model: string; promptVersion: string; createdAt: string };
export function EstimateReview({ estimate, verifiedAt, verifiedNote, description, phone, busy, onConfirm }: {
  estimate: DeskEstimate; verifiedAt: string | null; verifiedNote: string | null; description: string; phone: string | null; busy: boolean; onConfirm: (note: string) => Promise<void>;
}) {
  const [note, setNote] = useState(''), [confirmed, setConfirmed] = useState(false);
  const { assessment: a, pricing: p } = estimate;
  const money = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n / 100);
  async function confirm(event: FormEvent) { event.preventDefault(); if (!confirmed) return; await onConfirm(note); }
  return <section className="desk-card assessment-review">
    <div className="card-heading"><div><span className="eyebrow">DELIVERY ASSESSMENT · PRIVATE</span><h3>Confirm the work before quoting</h3><p>{a.summary}</p></div><ClipboardCheck size={25} aria-hidden="true" /></div>
    <div className="desk-estimate-facts"><div><span>Customer preliminary range</span><strong>{priceRange(p)}</strong></div><div><span>Suggested crew</span><strong>{p.crewSize} people</strong></div><div><span>Paid time per worker</span><strong>{p.paidMinutes.low}–{p.paidMinutes.high} min</strong></div><div><span>Stairs: pickup / delivery</span><strong>{a.pickupStairs ?? 'Unknown'} / {a.deliveryStairs ?? 'Unknown'}</strong></div></div>
    <details><summary>Customer description and planning assumptions</summary><p className="customer-story">{description}</p><ul>{p.assumptions.map(value => <li key={value}>{value}</li>)}</ul>{p.reviewReasons.map(value => <p key={value}>{value}</p>)}</details>
    <details><summary>Private cost calculation</summary><p>Labor: {money(p.costs.laborLowCents)}–{money(p.costs.laborHighCents)} at {money(p.costs.workerHourlyCostCents)}/worker/hour. Vehicle: {money(p.costs.vehicleCents)}. Coordination: {money(p.costs.coordinationCents)}.</p><p>Target contribution margin: {p.costs.marginBps / 100}%. Processing allowance: {p.costs.processingBps / 100}% + {money(p.costs.processingFixedCents)}. Policy: {p.policyVersion}.</p><p>Initial planning assumptions, not live carrier prices. Compare actual fulfillment costs before setting the final AVL price.</p></details>
    <div className="call-verification"><h4><Phone size={19} aria-hidden="true" /> Customer confirmation call</h4>{phone && <a className="text-button" href={`tel:${phone}`}>{phone}</a>}<ul><li>Confirm addresses, stairs and elevator fit, dimensions, parking, crew, equipment, timing, and scope.</li>{p.questions.map(value => <li key={value}>{value}</li>)}</ul>
      {verifiedAt ? <div className="notice success"><strong>Requirements confirmed {new Date(verifiedAt).toLocaleString()}</strong><p>{verifiedNote}</p><p>Use the confirmed scope and actual provider costs for the final quote.</p></div> : <form onSubmit={confirm}><label>What did you confirm or change?<textarea required minLength={20} maxLength={2000} value={note} onChange={e => setNote(e.target.value)} placeholder="Confirmed with customer: 3 flights at pickup, ground-floor delivery, two-person crew, parking within 30 feet…" /></label><label className="review-checkbox"><input type="checkbox" required checked={confirmed} onChange={e => setConfirmed(e.target.checked)} /> I spoke with the customer and confirmed the actual delivery requirements.</label><button className="secondary" disabled={busy || !confirmed}>Save call confirmation</button></form>}
    </div>
  </section>;
}

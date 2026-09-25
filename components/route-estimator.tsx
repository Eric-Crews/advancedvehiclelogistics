'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { ArrowRight, ClipboardCheck, Clock3, LoaderCircle, MapPin, Phone, Users } from 'lucide-react';
import type { PreparedEstimate } from '@/lib/job-estimate';
import { priceRange } from '@/lib/estimate-display';
import { VoiceNote } from './voice-note';

export type EstimatorProps = {
  origin: string; destination: string; miles: string; description: string; estimate: PreparedEstimate | null;
  onOrigin: (value: string) => void; onDestination: (value: string) => void; onMiles: (value: string) => void;
  onDescription: (value: string) => void; onPrepared: (value: PreparedEstimate) => void; onContinue: () => void;
};
export function RouteEstimator(props: EstimatorProps) {
  const [available, setAvailable] = useState<boolean | null>(null), [busy, setBusy] = useState(false), [voiceBusy, setVoiceBusy] = useState(false), [error, setError] = useState(''), [reviewed, setReviewed] = useState(false);
  const request = useRef<AbortController | null>(null), results = useRef<HTMLDivElement>(null);
  useEffect(() => { const controller = new AbortController(); void fetch('/api/estimate', { signal: controller.signal }).then(r => r.json()).then(d => setAvailable(Boolean((d as { available?: boolean }).available))).catch(() => {}); return () => { controller.abort(); request.current?.abort(); }; }, []);
  async function assess(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError(''); setReviewed(false); request.current = new AbortController();
    try {
      const response = await fetch('/api/estimate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ description: props.description, origin: props.origin, destination: props.destination, miles: props.miles.trim() ? Number(props.miles) : null }), signal: request.current.signal });
      const data = await response.json() as PreparedEstimate & { error?: string };
      if (!response.ok) throw new Error(data.error || 'We could not assess this delivery.');
      props.onPrepared(data); window.requestAnimationFrame(() => results.current?.focus({ preventScroll: false }));
    } catch (e) { if (!(e instanceof DOMException && e.name === 'AbortError')) setError(e instanceof Error ? e.message : 'Please try again.'); }
    finally { if (!request.current?.signal.aborted) setBusy(false); }
  }
  const estimate = props.estimate;
  return <section className="estimate-section shell" id="delivery-estimate" aria-labelledby="estimate-heading">
    <div className="estimate-card smart-estimate">
      <div className="estimate-heading"><div><span className="eyebrow">TELL US WHAT YOU NEED</span><h2 id="estimate-heading">Every delivery has a story. What’s yours?</h2></div><span className="estimate-rate">Deliveries from $60</span></div>
      <p className="estimate-intro">A couch upstairs? Mulch at the store? Tell us what’s moving, where it’s going, and what help you need. We account for the people and work involved.</p>
      <VoiceNote disabled={busy || available !== true} onBusyChange={setVoiceBusy} onTranscript={text => { const combined = props.description ? `${props.description}\n${text}` : text; props.onDescription(combined); if (combined.length > 2600) setError('Your description is over 2,600 characters. Please shorten it before estimating; your full transcript is still in the box.'); }} />
      <form onSubmit={assess}>
        <label className="description-label" htmlFor="delivery-story">Describe your delivery<textarea id="delivery-story" required minLength={20} maxLength={2600} rows={4} disabled={busy || voiceBusy} placeholder="I found a couch on Marketplace. It needs two people to carry it down three flights of stairs, then deliver it 2 miles across town. My home is on the ground floor." value={props.description} onChange={e => props.onDescription(e.target.value)} aria-describedby="story-help" /></label>
        <p id="story-help" className="smart-help">Helpful details: item size, quantity, stairs at each end, parking, and whether anything needs taking apart.</p>
        <div className="estimate-fields smart-route-fields">
          <label htmlFor="estimate-origin"><span><span className="route-dot" aria-hidden="true" />Pickup location <span className="optional">(if known)</span></span><input id="estimate-origin" maxLength={200} disabled={busy || voiceBusy} autoComplete="off" placeholder="Store or address, city, state" value={props.origin} onChange={e => props.onOrigin(e.target.value)} /></label>
          <label htmlFor="estimate-destination"><span><MapPin size={16} aria-hidden="true" />Delivery location <span className="optional">(if known)</span></span><input id="estimate-destination" maxLength={200} disabled={busy || voiceBusy} autoComplete="off" placeholder="Address, city, state" value={props.destination} onChange={e => props.onDestination(e.target.value)} /></label>
        </div>
        <details className="known-distance"><summary>Know the driving distance? Add it here.</summary><label htmlFor="estimate-miles">Pickup to delivery, in miles<input id="estimate-miles" type="number" inputMode="decimal" min="0.1" max="10000" step="0.1" disabled={busy || voiceBusy} placeholder="Optional, e.g. 2" value={props.miles} onChange={e => props.onMiles(e.target.value)} /></label><p>We’ll confirm the actual route. Distance is only one part of the estimate.</p></details>
        {available === false && <p className="estimate-availability" role="status">Online estimates are being set up. You can still send these details and AVL will work through the price with you.</p>}
        {error && <p className="notice error" role="alert">{error}</p>}
        <div className="smart-actions"><button className="primary" type="submit" disabled={busy || voiceBusy || available === false}>{busy ? <><LoaderCircle size={19} className="spin" aria-hidden="true" /> Reviewing your delivery…</> : <>{estimate ? 'Recalculate estimate' : 'Get my delivery estimate'} <ArrowRight size={19} aria-hidden="true" /></>}</button><button className="text-button" type="button" disabled={busy || voiceBusy} onClick={props.onContinue}>Have a person review it <ArrowRight size={17} aria-hidden="true" /></button></div>
        <p className="estimate-privacy">Your description is processed with OpenAI when you estimate. Check its interpretation before sending your request. No account or payment needed to estimate.</p>
      </form>
      {estimate && <div className="smart-result" ref={results} tabIndex={-1} aria-label="Your delivery assessment">
        <div className="smart-result-heading"><div><span className="eyebrow">{estimate.pricing.status === 'range' ? 'YOUR PRELIMINARY ESTIMATE' : 'LET’S CHECK THE DETAILS'}</span><h3>{priceRange(estimate.pricing)}</h3></div><span><Phone size={17} aria-hidden="true" /> Confirmed by phone before quoting</span></div>
        <p>{estimate.assessment.summary}</p>
        <div className="job-facts"><span><Users size={21} aria-hidden="true" /><strong>{estimate.pricing.crewSize} {estimate.pricing.crewSize === 1 ? 'person' : 'people'}</strong>Suggested crew</span><span><Clock3 size={21} aria-hidden="true" /><strong>{estimate.pricing.paidMinutes.low}–{estimate.pricing.paidMinutes.high} min</strong>Paid time per worker, incl. travel</span><span><ClipboardCheck size={21} aria-hidden="true" /><strong>{estimate.assessment.pickupStairs ?? '?'} / {estimate.assessment.deliveryStairs ?? '?'}</strong>Stair flights: pickup / delivery</span></div>
        {estimate.pricing.reviewReasons.length > 0 && <div className="job-questions"><h4>Why we need a closer look</h4><ul>{estimate.pricing.reviewReasons.map(item => <li key={item}>{item}</li>)}</ul></div>}
        {estimate.pricing.questions.length > 0 && <div className="job-questions"><h4>A few things to confirm</h4><ul>{estimate.pricing.questions.map(item => <li key={item}>{item}</li>)}</ul><p>Add anything you know to your description and recalculate, or let AVL help on the call.</p></div>}
        <details className="estimate-assumptions"><summary>What this estimate assumes</summary><ul>{estimate.pricing.assumptions.map(item => <li key={item}>{item}</li>)}</ul><p>This is a planning range, not a carrier quote or a booking. AVL checks the route, crew, access, and availability before you approve a final price.</p></details>
        <label className="review-checkbox"><input type="checkbox" checked={reviewed} onChange={e => setReviewed(e.target.checked)} /> I’ve reviewed these details and will confirm anything uncertain with AVL.</label>
        <button className="primary" type="button" disabled={!reviewed || busy || voiceBusy} onClick={props.onContinue}>Continue with this request <ArrowRight size={18} aria-hidden="true" /></button>
      </div>}
    </div>
  </section>;
}

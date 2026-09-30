'use client';

import { ArrowRight, Check, ClipboardList, MapPin, Package, Phone, Truck } from 'lucide-react';
import Link from 'next/link';
import { RouteEstimator, type EstimatorProps } from './route-estimator';

export type DeliveryCategory = 'furniture' | 'marketplace' | 'lumber' | 'landscaping' | 'appliance' | 'other';
type Props = EstimatorProps & {
  category: DeliveryCategory; onCategory: (value: DeliveryCategory) => void; onHow: () => void;
};

const freight = [
  { title: 'Pickup trucks', text: 'Smaller freight and items that need a practical open-bed move.', icon: Truck },
  { title: 'Hotshot & trailers', text: 'Longer routes and loads that call for a trailer or specialized setup.', icon: MapPin },
  { title: 'Box trucks & vans', text: 'Enclosed space for freight that needs protection in transit.', icon: Package },
];

export function DeliveryHome(props: Props) {
  return <>
    <section className="avl-hero freight-home-hero" aria-labelledby="hero-title">
      <div className="shell freight-home-grid">
        <div className="hero-copy">
          <span className="eyebrow"><span /> ADVANCED VEHICLE LOGISTICS</span>
          <h1 id="hero-title">FREIGHT HAS A ROUTE.<br /><span>WE FIND THE FIT.</span></h1>
          <p>Post a private-party load from one city to another. AVL reviews the shipment, finds an appropriate delivery option, and sends you a quote before anything is booked.</p>
          <div className="hero-actions"><a className="primary" href="#delivery-estimate">Post a load <ArrowRight size={19} aria-hidden="true" /></a><Link className="freight-hero-link" href="/drivers/opportunities">Find loads for your truck <ArrowRight size={18} aria-hidden="true" /></Link></div>
          <div className="hero-assurances"><span><Check size={17} aria-hidden="true" /> U.S. routes considered</span><span><Check size={17} aria-hidden="true" /> Human-reviewed quotes</span><span><Check size={17} aria-hidden="true" /> No charge to request</span></div>
        </div>
        <div className="freight-home-route" aria-label="Illustrative outbound and return routes; these are not posted loads">
          <div className="freight-route-top"><span>ONE TRIP · TWO DIRECTIONS</span><span>ROUTE EXAMPLE</span></div>
          <div className="freight-route-places"><span>Asheville, NC</span><span>Austin, TX</span></div>
          <div className="freight-route-track"><span className="freight-route-dot"/><span className="freight-route-line"/><span className="freight-route-dot"/></div>
          <div className="freight-route-legs"><div><span>OUTBOUND</span><strong>Move the load</strong></div><div><span>RETURN</span><strong>Look for the next one</strong></div></div>
          <p>The right return opportunity can make a route more productive. Matches are shown only when a real load is posted.</p>
          <div className="freight-route-footer"><Truck size={22} aria-hidden="true" /><span>Pickup · Hotshot · Box truck</span></div>
        </div>
      </div>
    </section>

    <RouteEstimator {...props} />

    <section className="shell freight-audiences" aria-label="Choose your path">
      <div className="freight-audience-card"><span className="eyebrow">HAVE SOMETHING TO SHIP?</span><h2>Give us the route and the load.</h2><p>Tell us what is moving, where it starts and ends, and when it needs to go. We review the details and respond with a quote or follow-up questions.</p><a className="text-button" href="#delivery-estimate">Start a load request <ArrowRight size={18} aria-hidden="true" /></a></div>
      <div className="freight-audience-card driver"><span className="eyebrow">HAVE A TRUCK?</span><h2>Find work that fits your route.</h2><p>See reviewed load summaries, check equipment and timing, and offer your rate. Look for a return load before committing to the trip home.</p><Link className="text-button" href="/drivers">Explore the driver network <ArrowRight size={18} aria-hidden="true" /></Link></div>
    </section>

    <section className="freight-capabilities" aria-labelledby="equipment-title"><div className="shell"><div className="section-heading"><div><span className="eyebrow">RIGHT LOAD. RIGHT VEHICLE.</span><h2 id="equipment-title">A NETWORK BUILT FOR THE WORK.</h2></div><p>We review vehicle fit and availability for every route.</p></div><div className="freight-capabilities-grid">{freight.map(item => <article key={item.title}><span className="service-icon"><item.icon size={25} strokeWidth={1.7} aria-hidden="true" /></span><h3>{item.title}</h3><p>{item.text}</p></article>)}</div></div></section>

    <section className="shell freight-process" id="how-delivery-works" aria-labelledby="process-title"><div className="freight-process-head"><span className="eyebrow">HOW AVL WORKS</span><h2 id="process-title">A real review before a real commitment.</h2><p>Load details matter more than a generic per-mile price. We work through the route, equipment, timing, handling, and provider fit before you decide.</p></div><div className="freight-process-grid"><article><span>01 / POST</span><ClipboardList size={25} aria-hidden="true" /><h3>Describe the load</h3><p>Share pickup and delivery areas, dimensions, weight, dates, and handling needs. You can start with what you know.</p></article><article><span>02 / REVIEW</span><MapPin size={25} aria-hidden="true" /><h3>We source the route</h3><p>AVL checks available delivery options and confirms the scope. A person reviews the final price before it goes to you.</p></article><article><span>03 / DECIDE</span><Check size={25} aria-hidden="true" /><h3>Approve the quote</h3><p>Review the quote in your account. Nothing is booked or charged just because you submitted a request.</p></article></div></section>

    <section className="freight-home-close"><div className="shell"><div><span className="eyebrow">MOVE SOMETHING FURTHER</span><h2>LET’S SEE WHAT THE ROUTE NEEDS.</h2><p>One load, a recurring lane, or a truck looking for the trip back. Start with the details.</p></div><div className="freight-close-actions"><a className="primary" href="#delivery-estimate">Post a load <ArrowRight size={18} aria-hidden="true" /></a><Link href="/drivers/opportunities">Browse driver opportunities</Link><a href="tel:+18283337155"><Phone size={18} aria-hidden="true" /> (828) 333-7155</a></div></div></section>
  </>;
}

'use client';

import { ArrowRight, Check, ClipboardList, Hammer, MapPin, MessageCircle, Package, Phone, Refrigerator, ShoppingBag, Sofa, Sprout } from 'lucide-react';
import { RouteEstimator, type EstimatorProps } from './route-estimator';

export type DeliveryCategory = 'furniture' | 'marketplace' | 'lumber' | 'landscaping' | 'appliance' | 'other';
const services = [
  { id: 'furniture', title: 'Furniture', description: 'The couch, table, or bed you love. Delivered where you need it.', icon: Sofa },
  { id: 'marketplace', title: 'Marketplace finds', description: 'Found a great deal? We’ll help with the getting-it-home part.', icon: ShoppingBag },
  { id: 'lumber', title: 'Building materials', description: 'Lumber, flooring, and the supplies that keep your project moving.', icon: Hammer },
  { id: 'landscaping', title: 'Yard & garden', description: 'Mulch, soil, plants, and supplies for your next outdoor project.', icon: Sprout },
  { id: 'appliance', title: 'Appliances', description: 'Tell us what you bought and the lifting or access help it needs.', icon: Refrigerator },
  { id: 'other', title: 'Business & more', description: 'Store pickups, business supplies, and deliveries a little out of the ordinary.', icon: Package },
] as const;
type Props = EstimatorProps & {
  category: DeliveryCategory; onCategory: (value: DeliveryCategory) => void; onHow: () => void;
};

export function DeliveryHome(props: Props) {
  return <>
    <section className="avl-hero" aria-labelledby="hero-title"><div className="shell hero-grid">
      <div className="hero-copy"><span className="eyebrow"><span /> EVERYDAY DELIVERY. EXTRAORDINARY HELP.</span><h1 id="hero-title">FROM THERE.<br /><span>TO YOUR DOOR.</span></h1><p>A great find. A weekend project. A delivery that won’t fit in your car. We help you get it there—with a clear price and a real person on your side.</p><div className="hero-actions"><a className="primary" href="#delivery-estimate">Get a delivery estimate <ArrowRight size={19} aria-hidden="true" /></a><a className="hero-call" href="tel:+18283337155"><Phone size={19} aria-hidden="true" /><span>Rather talk?<strong>(828) 333-7155</strong></span></a></div><div className="hero-assurances"><span><Check size={17} aria-hidden="true" /> Requests across the U.S.</span><span><Check size={17} aria-hidden="true" /> No payment to get started</span></div></div>
      <figure className="hero-photo"><img src="/images/everyday-delivery.webp" alt="Two delivery helpers carrying a sofa to a home" width="1200" height="800" fetchPriority="high" /><figcaption><span className="photo-icon"><Package size={24} aria-hidden="true" /></span><span>Big, bulky, or just out of reach.<strong>Let’s make it an easy delivery.</strong></span></figcaption></figure>
    </div></section>

    <RouteEstimator {...props} />

    <section className="shell everyday-section" id="what-we-deliver" aria-labelledby="services-title"><div className="section-heading"><div><span className="eyebrow">WHAT WE DELIVER</span><h2 id="services-title">FOR THE THINGS LIFE THROWS YOUR WAY.</h2></div><p>You find it. You need it.<br />We help you move it.</p></div><div className="everyday-grid">{services.map(service => <button className="everyday-card" key={service.id} onClick={() => { props.onCategory(service.id); props.onContinue(); }} type="button" data-testid={`delivery-${service.id}`}><span className="service-icon"><service.icon size={25} strokeWidth={1.7} aria-hidden="true" /></span><h3>{service.title}</h3><p>{service.description}</p><span className="service-cta">Request delivery <ArrowRight size={17} aria-hidden="true" /></span></button>)}</div></section>

    <section className="process-section" id="how-delivery-works" aria-labelledby="process-title"><div className="shell"><div className="section-heading"><div><span className="eyebrow">LESS FIGURING IT OUT. MORE GETTING IT DONE.</span><h2 id="process-title">ONE REQUEST. WE TAKE IT FROM THERE.</h2></div><button type="button" className="light-link" onClick={props.onHow}>How AVL works <ArrowRight size={18} aria-hidden="true" /></button></div><div className="process-grid">{[
      { icon: ClipboardList, title: 'Tell us what’s moving.', text: 'Type or speak what you need moved. Include stairs, size, access, and timing in your own words.' },
      { icon: MessageCircle, title: 'Get one clear quote.', text: 'See a preliminary estimate. We call to confirm the details, then send the final price and delivery plan.' },
      { icon: Package, title: 'Approve. We arrange it.', text: 'Once you approve and pay, we coordinate the delivery and keep you in the loop.' },
    ].map((step, index) => <article className="process-card" key={step.title}><div className="process-top"><span>{String(index + 1).padStart(2, '0')}</span><step.icon size={28} strokeWidth={1.5} aria-hidden="true" /></div><h3>{step.title}</h3><p>{step.text}</p></article>)}</div></div></section>

    <section className="shell route-pricing-section" aria-labelledby="pricing-title"><div className="national-copy"><span className="eyebrow">ROOTED IN SERVICE. READY TO GO FURTHER.</span><h2>YOUR CITY.<br />YOUR DELIVERY.</h2><p>A Marketplace pickup in Seattle. Garden supplies in Denver. Lumber in Charlotte. Start with what you need moved, wherever you are.</p><p className="coverage-note"><MapPin size={20} aria-hidden="true" /><span>Requests welcome across the U.S. We confirm service availability for your route, items, and schedule.</span></p></div><div className="pricing-card"><span className="eyebrow">PRICED FOR THE WORK INVOLVED</span><h2 id="pricing-title">THE WHOLE JOB COUNTS.</h2><p className="big-rate">$60<span>minimum delivery price</span></p><p>Your estimate considers the people, time, travel, and handling your delivery actually needs.</p><div className="pricing-example"><span>A two-mile trip can still need two movers.</span><strong>Stairs. Lifting. Time.<small>We account for all of it.</small></strong></div><p className="pricing-note">A preliminary estimate helps you plan. We confirm the details with you and check availability before sending a final quote.</p><a className="text-button" href="#delivery-estimate">Describe your delivery <ArrowRight size={17} aria-hidden="true" /></a></div></section>

    <section className="help-band"><div className="shell"><div><span className="eyebrow">GOOD PEOPLE. PRACTICAL HELP.</span><h2>LET’S GET YOUR DAY MOVING.</h2><p>Have a tricky item or a question? Start a request, or give us a call.</p></div><div className="help-actions"><a href="#delivery-estimate" className="primary">Start my delivery <ArrowRight size={18} aria-hidden="true" /></a><a href="tel:+18283337155"><Phone size={18} aria-hidden="true" /> (828) 333-7155</a></div></div></section>
  </>;
}

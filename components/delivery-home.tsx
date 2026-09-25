'use client';

import {
  ArrowRight, ArrowUpRight, Check, ClipboardCheck, Hammer, MapPin,
  MessageCircle, Package, Phone, Refrigerator, Route, ShieldCheck,
  ShoppingBag, Sofa, Sprout,
} from 'lucide-react';

export type DeliveryCategory = 'furniture' | 'marketplace' | 'lumber' | 'landscaping' | 'appliance' | 'other';

const choices = [
  { id: 'furniture', label: 'Furniture', icon: Sofa },
  { id: 'marketplace', label: 'Marketplace', icon: ShoppingBag },
  { id: 'lumber', label: 'Lumber', icon: Hammer },
  { id: 'landscaping', label: 'Yard supplies', icon: Sprout },
  { id: 'appliance', label: 'Appliances', icon: Refrigerator },
  { id: 'other', label: 'Something else', icon: Package },
] as const;

type DeliveryHomeProps = {
  category: DeliveryCategory;
  origin: string;
  destination: string;
  onCategory: (value: DeliveryCategory) => void;
  onOrigin: (value: string) => void;
  onDestination: (value: string) => void;
  onContinue: () => void;
  onHow: () => void;
};

export function DeliveryHome({ category, origin, destination, onCategory, onOrigin, onDestination, onContinue, onHow }: DeliveryHomeProps) {
  return (
    <>
      <section className="delivery-hero" aria-labelledby="hero-title">
        <div className="hero-copy">
          <span className="eyebrow"><span className="eyebrow-line" /> The easier way to move what matters</span>
          <h1 id="hero-title">Your next delivery, <span>handled.</span></h1>
          <p className="hero-description">Found the perfect couch? Picking up supplies? Tell us what you need moved. We’ll work out the details and give you one clear quote.</p>
          <div className="hero-values">
            <span><Check size={17} /> One simple request</span>
            <span><Check size={17} /> Reviewed by a real person</span>
            <span><Check size={17} /> No charge to request a quote</span>
          </div>
          <a className="hero-phone" href="tel:+18283337155">
            <span className="phone-disc"><Phone size={19} /></span>
            <span>Rather talk it through?<strong>Call (828) 333-7155 <ArrowUpRight size={16} /></strong></span>
          </a>
        </div>
        <div className="starter-wrap">
          <div className="quote-starter">
            <div className="starter-heading">
              <span className="small-icon"><Route size={23} strokeWidth={1.8} /></span>
              <div><span className="starter-kicker">YOUR DELIVERY STARTS HERE</span><h2>What are we moving?</h2></div>
              <span className="starter-step">01 / 03</span>
            </div>
            <form onSubmit={(event) => { event.preventDefault(); onContinue(); }}>
              <fieldset className="starter-categories">
                <legend>Choose what sounds closest</legend>
                <div>{choices.map((choice) => (
                  <label key={choice.id} className={category === choice.id ? 'active' : ''}>
                    <input type="radio" name="starter-category" checked={category === choice.id} onChange={() => onCategory(choice.id)} />
                    <choice.icon size={23} strokeWidth={1.7} />
                    <span>{choice.label}</span>
                  </label>
                ))}</div>
              </fieldset>
              <div className={'route-inputs' + (origin && destination ? ' route-complete' : '')}>
                <div className="route-rail" aria-hidden="true" />
                <label><span className="route-point" aria-hidden="true" /><span className="route-field"><span>Pickup location</span><input required minLength={3} placeholder="Store, seller, or address" value={origin} onChange={(event) => onOrigin(event.target.value)} /></span></label>
                <label><span className="route-point destination" aria-hidden="true" /><span className="route-field"><span>Delivery location</span><input required minLength={3} placeholder="Your address or destination" value={destination} onChange={(event) => onDestination(event.target.value)} /></span></label>
              </div>
              <button className="primary starter-button" type="submit">Get started <ArrowRight size={19} /></button>
              <p className="starter-note"><ShieldCheck size={15} /> Free to request. Nothing is booked until you approve it.</p>
            </form>
          </div>
          <div className="starter-under"><span className="under-symbol"><MapPin size={15} /></span> Local coordination, with a human in the loop.</div>
        </div>
      </section>

      <section className="service-section" aria-labelledby="service-title">
        <div className="section-heading"><div><span className="eyebrow">DELIVERY FOR REAL LIFE</span><h2 id="service-title">The thing you need moved?<br /><em>We get it.</em></h2></div><p>Big purchases, weekend projects, and everything in between. Start with what’s familiar.</p></div>
        <div className="service-grid">
          <button type="button" onClick={() => { onCategory('marketplace'); onContinue(); }} className="service-card card-home">
            <span className="service-art" aria-hidden="true"><span className="service-orbit" /><Sofa size={90} strokeWidth={1.1} /></span>
            <span className="service-caption">01 / A GREAT FIND</span><h3>Found it. Love it.<br />Let’s get it home.</h3><p>Furniture, Marketplace finds, and appliances that won’t fit in your car.</p><span className="service-link">Plan a pickup <ArrowUpRight size={20} /></span>
          </button>
          <button type="button" onClick={() => { onCategory('lumber'); onContinue(); }} className="service-card card-project">
            <span className="service-art" aria-hidden="true"><span className="service-orbit" /><Hammer size={83} strokeWidth={1.1} /></span>
            <span className="service-caption">02 / A PROJECT IN MOTION</span><h3>Less hauling.<br />More getting things done.</h3><p>Lumber, mulch, and store pickups for the project you’re ready to start.</p><span className="service-link">Move your supplies <ArrowUpRight size={20} /></span>
          </button>
          <button type="button" onClick={() => { onCategory('other'); onContinue(); }} className="service-card card-unusual">
            <span className="service-art" aria-hidden="true"><span className="service-orbit" /><Package size={87} strokeWidth={1.1} /></span>
            <span className="service-caption">03 / AN UNUSUAL REQUEST</span><h3>Big, awkward,<br />or a little unusual?</h3><p>Tell us about it. We’ll review the size, route, and handling it needs.</p><span className="service-link">Tell us what’s moving <ArrowUpRight size={20} /></span>
          </button>
        </div>
      </section>

      <section className="connection-section" aria-labelledby="process-title">
        <div className="connection-intro"><span className="eyebrow">A BETTER WAY TO GET IT THERE</span><h2 id="process-title">You tell us the what.<br /><em>We figure out the how.</em></h2><p>No need to choose a truck, compare carriers, or learn delivery jargon. We review the practical details and come back with one AVL quote.</p><button className="text-button" type="button" onClick={onHow}>How AVL works <ArrowRight size={18} /></button></div>
        <div className="connection-steps">
          {[
            [ClipboardCheck, 'Tell us what’s moving', 'Give us the item, pickup, destination, and any helpful details.'],
            [Route, 'We check what fits', 'A person reviews the route, handling needs, and available options.'],
            [MessageCircle, 'You decide', 'See one clear AVL quote before you choose what happens next.'],
          ].map(([Icon, title, description], index) => {
            const StepIcon = Icon as typeof ClipboardCheck;
            return <div className="connection-step" key={index}><span className="step-icon"><StepIcon size={22} /></span><div><small>0{index + 1}</small><h3>{String(title)}</h3><p>{String(description)}</p></div></div>;
          })}
        </div>
      </section>

      <section className="agent-strip"><span className="agent-icon"><Phone size={23} /></span><div><span className="eyebrow">HERE WHEN YOU NEED US</span><h3>A real person is part of every quote.</h3><p>Have a tricky item or a time sensitive pickup? Call us and talk through the details.</p></div><a className="secondary" href="tel:+18283337155">Call (828) 333-7155 <ArrowUpRight size={17} /></a></section>
    </>
  );
}

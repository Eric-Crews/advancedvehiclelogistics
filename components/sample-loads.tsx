import { CalendarDays, MapPin, ShieldCheck, Truck } from 'lucide-react';

const samples = [
  {
    id: 'A',
    lane: 'Asheville, NC → Austin, TX',
    direction: 'OUTBOUND EXAMPLE',
    type: 'Crated commercial equipment',
    weight: 'Approx. 1,600–2,000 lb',
    vehicle: 'Pickup with suitable trailer or box truck',
    timing: 'Flexible pickup window',
    handling: 'Loading equipment to be confirmed',
  },
  {
    id: 'B',
    lane: 'Austin, TX → Asheville, NC',
    direction: 'RETURN EXAMPLE',
    type: 'Palletized building supplies',
    weight: 'Approx. 900–1,300 lb',
    vehicle: 'Pickup with trailer or box truck',
    timing: 'Flexible pickup window',
    handling: 'Unloading details to be confirmed',
  },
] as const;

export function SampleLoads() {
  return <section className="sample-loads" aria-labelledby="sample-loads-title">
    <div className="sample-loads-heading"><div><span className="eyebrow">ILLUSTRATIVE LISTINGS</span><h3 id="sample-loads-title">What a private lead could show</h3></div><span className="sample-loads-label">SAMPLES · NOT AVAILABLE</span></div>
    <p className="sample-loads-intro">A driver sees enough to assess the lane and equipment before requesting access. Shipper identity, contacts, street addresses, and exact pickup instructions stay private.</p>
    <div className="sample-loads-grid">{samples.map(sample => <article className="sample-load-card" key={sample.id}>
      <div className="sample-load-top"><span>DEMO {sample.id}</span><span>{sample.direction}</span></div>
      <h4><MapPin size={21} aria-hidden="true" /> {sample.lane}</h4>
      <p>{sample.type}</p>
      <ul><li><Truck size={17} aria-hidden="true" /> {sample.vehicle}</li><li>{sample.weight}</li><li><CalendarDays size={17} aria-hidden="true" /> {sample.timing}</li><li>{sample.handling}</li></ul>
      <div className="sample-load-private"><ShieldCheck size={19} aria-hidden="true" /><span>Contact and exact location hidden in this preview</span></div>
    </article>)}</div>
    <p className="sample-loads-foot">These two listings demonstrate an outbound and return lane. They are fictional, cannot be bid on, and are not included in live board results.</p>
  </section>;
}

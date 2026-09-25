'use client';

import { Show, SignInButton, SignUpButton, useAuth } from '@clerk/nextjs';
import { ArrowLeft, ArrowRight, CalendarDays, Check, MapPin, Package, RefreshCw, Truck } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { DriverFooter } from '@/components/driver-footer';
import { SiteHeader } from '@/components/site-header';

type DriverProfile = { businessName: string; contactEmail: string; mcNumber: string; equipment: string; status: string };
type Opportunity = { id: number; title: string; description: string; origin: string; destination: string; pickupDate: string; lengthFt: number | null; weightLbs: number | null; equipment: string | null; loading: string | null; unloading: string | null };

export default function DriverOpportunitiesPage() {
  const { isLoaded, isSignedIn } = useAuth();
  const [profile, setProfile] = useState<DriverProfile | null>(null);
  const [loads, setLoads] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [selected, setSelected] = useState<number | null>(null);
  const [equipment, setEquipment] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');

  const refresh = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const driverResponse = await fetch('/api/drivers');
      const driverData = await driverResponse.json() as { driver?: DriverProfile | null; error?: string };
      if (!driverResponse.ok) throw new Error(driverData.error || 'Could not load your carrier profile.');
      setProfile(driverData.driver || null);
      if (!driverData.driver) { setLoads([]); return; }
      setEquipment(driverData.driver.equipment.slice(0, 100));
      const boardResponse = await fetch('/api/board');
      const boardData = await boardResponse.json() as { loads?: Opportunity[]; error?: string };
      if (!boardResponse.ok) throw new Error(boardData.error || 'Could not load opportunities.');
      setLoads(boardData.loads || []);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not load opportunities.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (!isSignedIn) return; const frame = requestAnimationFrame(() => void refresh()); return () => cancelAnimationFrame(frame); }, [isSignedIn, refresh]);

  async function offer(event: FormEvent<HTMLFormElement>, loadId: number) {
    event.preventDefault();
    if (!profile) return;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const response = await fetch('/api/bids', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ loadId, carrierName: profile.businessName, contactEmail: profile.contactEmail, mcNumber: profile.mcNumber, equipment, amount: Number(amount), note }),
      });
      const data = await response.json() as { error?: string };
      if (!response.ok) throw new Error(data.error || 'Could not send your rate.');
      setSelected(null);
      setAmount('');
      setNote('');
      setNotice(`Rate for load #${loadId} received. AVL will review it before making any assignment.`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not send your rate.');
    } finally {
      setBusy(false);
    }
  }

  return <>
    <SiteHeader active="board" />
    <main id="main-content">
      <section className="driver-board-hero"><div className="shell"><Link href="/drivers" className="driver-board-back"><ArrowLeft size={17} aria-hidden="true" /> For drivers</Link><span className="driver-kicker"><span /> AVL CARRIER NETWORK</span><h1>Opportunities that fit your operation.</h1><p>See the details AVL has shared, choose the jobs that suit your equipment, and offer the rate that works for you.</p></div></section>
      <div className="shell driver-board-layout">
        <section className="driver-board-main" aria-labelledby="driver-board-title">
          <div className="driver-board-heading"><div><span className="eyebrow">SPECIALTY DELIVERIES</span><h2 id="driver-board-title">Open opportunities</h2></div>{isSignedIn && profile && <button className="secondary" type="button" onClick={() => void refresh()} disabled={loading}><RefreshCw size={17} aria-hidden="true" /> Refresh</button>}</div>
          {!isLoaded && <div className="driver-board-empty" role="status">Loading your account…</div>}
          <Show when="signed-out"><div className="driver-board-empty"><div className="driver-empty-icon"><Truck size={28} /></div><h3>See what’s available.</h3><p>Create an account and register your carrier business to browse reviewed specialty loads.</p><div className="driver-empty-actions"><SignUpButton mode="modal"><button className="primary" type="button">Create an account <ArrowRight size={18} /></button></SignUpButton><SignInButton mode="modal"><button className="secondary" type="button">Sign in</button></SignInButton></div></div></Show>
          <Show when="signed-in">
            {loading && <div className="driver-board-empty" role="status">Checking for open opportunities…</div>}
            {!loading && !profile && !error && <div className="driver-board-empty"><div className="driver-empty-icon"><Truck size={28} /></div><h3>Tell us about your carrier business first.</h3><p>Once your profile is saved, you can browse the current board and send a rate for review.</p><Link className="primary" href="/drivers#carrier-registration">Register your carrier business <ArrowRight size={18} /></Link></div>}
            {error && <div className="notice error" role="alert">{error}</div>}
            {notice && <div className="notice success" role="status">{notice}</div>}
            {!loading && profile && loads.length === 0 && !error && <div className="driver-board-empty"><div className="driver-empty-icon"><Package size={28} /></div><h3>Nothing open right now.</h3><p>AVL shares specialty jobs after reviewing their scope. Check back as new opportunities become available.</p><button className="secondary" type="button" onClick={() => void refresh()}>Check again</button></div>}
            {!loading && profile && loads.length > 0 && <div className="driver-load-list">{loads.map(load => <article className="driver-load-card" key={load.id}>
              <div className="driver-load-top"><span className="driver-load-number">LOAD #{load.id}</span><span className="driver-load-availability"><span /> Open for rates</span></div>
              <h3>{load.title}</h3>
              <div className="driver-load-route"><MapPin size={20} aria-hidden="true" /><span>{load.origin} <span aria-hidden="true">→</span> {load.destination}</span></div>
              <p>{load.description}</p>
              <div className="driver-load-facts"><span><CalendarDays size={16} /> {load.pickupDate === 'flexible' ? 'Flexible pickup' : `Preferred pickup: ${load.pickupDate}`}</span>{load.weightLbs != null && <span>{load.weightLbs.toLocaleString()} lb</span>}{load.lengthFt != null && <span>{load.lengthFt} ft longest side</span>}{load.equipment && <span><Truck size={16} /> {load.equipment}</span>}</div>
              {(load.loading || load.unloading) && <p className="driver-load-handling">{load.loading && `Loading: ${load.loading}`}{load.loading && load.unloading && ' · '}{load.unloading && `Unloading: ${load.unloading}`}</p>}
              <div className="driver-load-action"><button className="secondary" type="button" aria-expanded={selected === load.id} onClick={() => { setSelected(selected === load.id ? null : load.id); setAmount(''); setNote(''); setEquipment(profile.equipment.slice(0, 100)); setError(''); }}> {selected === load.id ? 'Close rate form' : 'Offer a rate'} <ArrowRight size={17} aria-hidden="true" /></button><span>Rates are reviewed before a load is assigned.</span></div>
              {selected === load.id && <form className="driver-rate-form" onSubmit={event => void offer(event, load.id)}><h4>Your rate for this load</h4><p>Submitted as <strong>{profile.businessName}</strong> · MC {profile.mcNumber}</p><div className="fields"><label>Rate in dollars<input required type="number" min="0.01" max="1000000" step="0.01" inputMode="decimal" value={amount} onChange={event => setAmount(event.target.value)} placeholder="Your total rate" /></label><label>Equipment you’ll use<input required minLength={3} maxLength={100} value={equipment} onChange={event => setEquipment(event.target.value)} /></label><label className="full">Anything we should know? <span className="optional">(optional)</span><textarea maxLength={1000} value={note} onChange={event => setNote(event.target.value)} placeholder="Availability, loading needs, timing, or equipment details" /></label></div><button className="primary" type="submit" disabled={busy}>{busy ? 'Sending your rate…' : 'Send rate for review'} <ArrowRight size={17} /></button></form>}
            </article>)}</div>}
          </Show>
        </section>
        <aside className="driver-board-aside"><div className="driver-aside-card"><span className="driver-aside-symbol"><Truck size={25} /></span><span className="eyebrow">YOUR CARRIER PROFILE</span>{profile ? <><h3>{profile.businessName}</h3><p>MC {profile.mcNumber}</p><span className="driver-aside-status"><Check size={17} /> {profile.status === 'approved' ? 'Approved' : 'Under review'}</span><Link href="/drivers#carrier-registration">View your registration <ArrowRight size={16} /></Link></> : <><h3>Start with the basics.</h3><p>Your business and equipment details help us identify the work that may fit.</p><Link href="/drivers#carrier-registration">Register your carrier business <ArrowRight size={16} /></Link></>}</div><div className="driver-aside-help"><h3>How the board works</h3><p>Only reviewed load summaries appear here. Offering a rate does not book the job. AVL confirms the details and carrier fit before an assignment.</p><a href="tel:+18283337155">Questions? Call (828) 333-7155 <ArrowRight size={16} /></a></div></aside>
      </div>
    </main>
    <DriverFooter />
  </>;
}

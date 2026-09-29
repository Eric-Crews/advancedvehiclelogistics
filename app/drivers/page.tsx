'use client';

import { Show, SignInButton, SignUpButton, useAuth } from '@clerk/nextjs';
import { ArrowRight, Check, ClipboardCheck, MapPin, ShieldCheck, Truck } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState, type FormEvent } from 'react';
import { DriverFooter } from '@/components/driver-footer';
import { SiteHeader } from '@/components/site-header';

type DriverProfile = {
  businessName: string;
  contactEmail: string;
  mcNumber: string;
  dotNumber: string | null;
  equipment: string;
  status: string;
};

const blank = { businessName: '', contactEmail: '', mcNumber: '', dotNumber: '', equipment: '' };

export default function DriversPage() {
  const { isLoaded, isSignedIn } = useAuth();
  const [form, setForm] = useState(blank);
  const [status, setStatus] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isSignedIn) return;
    let active = true;
    void fetch('/api/drivers')
      .then(async response => {
        const data = await response.json() as { driver?: DriverProfile | null; error?: string };
        if (!response.ok) throw new Error(data.error || 'Could not load your registration.');
        return data.driver;
      })
      .then(driver => {
        if (!active) return;
        if (!driver) { setForm(blank); setStatus(''); return; }
        setForm({
          businessName: driver.businessName,
          contactEmail: driver.contactEmail,
          mcNumber: driver.mcNumber,
          dotNumber: driver.dotNumber || '',
          equipment: driver.equipment,
        });
        setStatus(driver.status);
      })
      .catch(cause => { if (active) setError(cause instanceof Error ? cause.message : 'Could not load your registration.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [isSignedIn]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setMessage('');
    setSaving(true);
    try {
      const response = await fetch('/api/drivers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await response.json() as { status?: string; error?: string };
      if (!response.ok) throw new Error(data.error || 'Could not save your registration.');
      setStatus(data.status || 'pending_verification');
      setMessage('Your carrier registration is saved. AVL will review your details before selecting you for a load.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not save your registration.');
    } finally {
      setSaving(false);
    }
  }

  return <>
    <SiteHeader active="board" />
    <main id="main-content">
      <section className="driver-hero driver-freight-hero">
        <div className="shell driver-freight-grid">
          <div className="driver-hero-copy">
            <span className="driver-kicker"><span /> AVL PRIVATE LOAD BOARD</span>
            <h1>Find the load. <em>Find the way back.</em></h1>
            <p>Longer routes make more sense when you can line up the next move. Browse private-party freight opportunities for pickup trucks, hotshots, cargo vans, and box trucks.</p>
            <div className="driver-hero-actions"><Link className="primary" href="/drivers/opportunities">View the load board <ArrowRight size={19} aria-hidden="true" /></Link><a className="driver-light-link" href="#carrier-registration">Join the network</a></div>
            <div className="driver-hero-facts"><span><Check size={17} /> See route and load details</span><span><Check size={17} /> Offer your rate</span><span><Check size={17} /> Find a return load</span></div>
          </div>
          <div className="driver-route-panel" aria-label="Example of an outbound and return route, not current load listings">
            <div className="driver-route-panel-top"><span>THE ROUTE MATTERS</span><span>EXAMPLE</span></div>
            <div className="driver-route-leg"><span className="driver-route-index">01 / OUTBOUND</span><strong>Asheville <span>→</span> Austin</strong><p>A long haul is one side of the equation.</p></div>
            <div className="driver-route-leg driver-return-leg"><span className="driver-route-index">02 / RETURN</span><strong>Austin <span>→</span> Asheville</strong><p>Look for another real load before heading home.</p></div>
            <div className="driver-route-panel-bottom">Browse actual postings and plan both directions.</div>
          </div>
        </div>
      </section>

      <section className="shell driver-intro" aria-label="How the AVL load board works">
        <div className="driver-intro-heading"><span className="eyebrow">BUILT AROUND THE WHOLE TRIP</span><h2>Good freight starts with a useful route.</h2></div>
        <div className="driver-intro-grid">
          <article><span className="driver-step-icon"><Truck size={23} /></span><strong>01 / YOUR EQUIPMENT</strong><h3>Bring the right setup.</h3><p>Pickup truck, trailer, hotshot rig, cargo van, or box truck. Tell us what you operate and which loads you can handle.</p></article>
          <article><span className="driver-step-icon"><MapPin size={23} /></span><strong>02 / YOUR ROUTE</strong><h3>Check both directions.</h3><p>Compare origin, destination, pickup timing, load dimensions, and any return opportunities actually posted to the board.</p></article>
          <article><span className="driver-step-icon"><ClipboardCheck size={23} /></span><strong>03 / YOUR RATE</strong><h3>Make the numbers work.</h3><p>Offer a rate that accounts for your time, equipment, handling, and empty miles. AVL confirms every assignment individually.</p></article>
        </div>
      </section>

      <section className="driver-register-wrap" id="carrier-registration">
        <div className="shell driver-register-grid">
          <div className="driver-register-copy">
            <span className="eyebrow">JOIN THE AVL DRIVER NETWORK</span>
            <h2>Tell us what you drive.</h2>
            <p>Create a driver profile for the private load board. We review your equipment and authority details before matching you with work.</p>
            <div className="driver-requirements"><h3>Have these details handy</h3><ul><li>Business or driver name and contact email</li><li>MC and USDOT numbers, if applicable to your operation</li><li>Vehicle type, trailer, capacity, and service area</li></ul></div>
            <div className="driver-local-note"><ShieldCheck size={21} aria-hidden="true" /><p><strong>Authority depends on the work.</strong> You can register a pickup or box truck without an MC number. AVL reviews the route and required credentials before assigning a load.</p></div>
          </div>
          <div className="driver-form-card">
            <div className="driver-form-heading"><span className="eyebrow">DRIVER REGISTRATION</span><h2>Your driver profile</h2><p>We’ll review your information before selecting you for a load.</p></div>
            {!isLoaded || (isSignedIn && loading) ? <p className="muted" role="status">Loading your profile…</p> : null}
            <Show when="signed-out"><div className="driver-auth"><p>Create a free account to save your driver profile and see available opportunities.</p><SignUpButton mode="modal"><button className="primary" type="button">Create driver account <ArrowRight size={18} /></button></SignUpButton><span>Already have an account? <SignInButton mode="modal"><button className="driver-inline-button" type="button">Sign in</button></SignInButton></span></div></Show>
            <Show when="signed-in">
              {status && <div className="driver-status" role="status"><span className="driver-status-icon"><Check size={19} /></span><div><strong>{status === 'approved' ? 'Registration approved' : 'Registration received'}</strong><p>{status === 'approved' ? 'Your driver details are on file.' : 'Your information is under review. You can browse open opportunities while we verify your details.'}</p></div></div>}
              {status !== 'approved' && <form onSubmit={submit} className="driver-form">
                <div className="fields"><label>Business or driver name<input required minLength={2} maxLength={150} autoComplete="organization" value={form.businessName} onChange={event => setForm({ ...form, businessName: event.target.value })} placeholder="Name you operate under" /></label><label>Business email<input required type="email" maxLength={200} autoComplete="email" value={form.contactEmail} onChange={event => setForm({ ...form, contactEmail: event.target.value })} placeholder="you@company.com" /></label><label>MC number <span className="optional">(if applicable)</span><input maxLength={30} value={form.mcNumber} onChange={event => setForm({ ...form, mcNumber: event.target.value })} placeholder="MC number" /></label><label>USDOT number <span className="optional">(if applicable)</span><input maxLength={30} value={form.dotNumber} onChange={event => setForm({ ...form, dotNumber: event.target.value })} placeholder="USDOT number" /></label><label className="full">Vehicles and equipment<input required minLength={3} maxLength={200} value={form.equipment} onChange={event => setForm({ ...form, equipment: event.target.value })} placeholder="Pickup, 24-ft flatbed, 16-ft box truck…" /></label></div>
                <button type="submit" className="primary" disabled={saving || loading}>{saving ? 'Saving your profile…' : status ? 'Update driver profile' : 'Save driver profile'} <ArrowRight size={18} aria-hidden="true" /></button>
                <p className="driver-form-note">Your profile is private. AVL reviews carrier details before choosing a provider for any job.</p>
              </form>}
              {status === 'approved' && <div className="driver-approved-profile"><p><strong>Operator</strong><span>{form.businessName}</span></p>{form.mcNumber && <p><strong>MC number</strong><span>{form.mcNumber}</span></p>}<p><strong>Equipment</strong><span>{form.equipment}</span></p><p><strong>Contact</strong><span>{form.contactEmail}</span></p></div>}
              {error && <p className="notice error" role="alert">{error}</p>}
              {message && <p className="notice success" role="status">{message}</p>}
              {status && <Link href="/drivers/opportunities" className="driver-opportunities-link">View open opportunities <ArrowRight size={18} aria-hidden="true" /></Link>}
            </Show>
            <p className="driver-payout-note">Payment terms are confirmed for each accepted job. Online payout setup is not available yet.</p>
          </div>
        </div>
      </section>
      <section className="shell driver-close"><div><span className="eyebrow">QUESTIONS BEFORE YOU JOIN?</span><h2>Let’s talk about your operation.</h2><p>Tell us what you drive, where you work, and what types of loads fit your setup.</p></div><a className="secondary" href="tel:+18283337155">Call (828) 333-7155 <ArrowRight size={18} /></a></section>
    </main>
    <DriverFooter />
  </>;
}

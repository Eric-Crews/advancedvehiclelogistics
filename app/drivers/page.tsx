'use client';

import { Show, SignInButton, SignUpButton, useAuth } from '@clerk/nextjs';
import { ArrowRight, Check, ClipboardCheck, MapPin, ShieldCheck, Truck } from 'lucide-react';
import Image from 'next/image';
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
      <section className="driver-hero">
        <div className="shell driver-hero-grid">
          <div className="driver-hero-copy">
            <span className="driver-kicker"><span /> FOR THE PEOPLE WHO MOVE THINGS</span>
            <h1>Good deliveries need <em>good people.</em></h1>
            <p>Furniture, building materials, specialty loads. When a job needs the right vehicle and the right hands, AVL connects the details with professional drivers and carriers.</p>
            <div className="driver-hero-actions">
              <a className="primary" href="#carrier-registration">Register your carrier business <ArrowRight size={19} aria-hidden="true" /></a>
              <Link className="driver-light-link" href="/drivers/opportunities">Explore opportunities <ArrowRight size={18} aria-hidden="true" /></Link>
            </div>
            <div className="driver-hero-facts"><span><Check size={17} /> Review the job first</span><span><Check size={17} /> Offer your own rate</span><span><Check size={17} /> No charge to register</span></div>
          </div>
          <figure className="driver-hero-image">
            <Image src="/images/everyday-delivery.webp" alt="Two delivery professionals carrying a sofa from a van" width={1400} height={933} unoptimized priority />
            <figcaption><Truck size={21} aria-hidden="true" /><span>For work that calls for the right crew and vehicle.</span></figcaption>
          </figure>
        </div>
      </section>

      <section className="shell driver-intro" aria-label="How carrier opportunities work">
        <div className="driver-intro-heading"><span className="eyebrow">A MORE THOUGHTFUL WAY TO FIND THE FIT</span><h2>A clear job before you commit.</h2></div>
        <div className="driver-intro-grid">
          <article><span className="driver-step-icon"><ClipboardCheck size={23} /></span><strong>01 / THE DETAILS</strong><h3>We review the request.</h3><p>AVL checks the item, route, equipment, access, and help needed before sharing a suitable specialty load.</p></article>
          <article><span className="driver-step-icon"><MapPin size={23} /></span><strong>02 / YOUR DECISION</strong><h3>You decide what fits.</h3><p>Registered carriers can see open opportunities and offer a rate based on the work and equipment involved.</p></article>
          <article><span className="driver-step-icon"><ShieldCheck size={23} /></span><strong>03 / CONFIRMATION</strong><h3>We confirm the match.</h3><p>Every rate and carrier profile is reviewed. Registration or a submitted rate does not guarantee an assignment.</p></article>
        </div>
      </section>

      <section className="driver-register-wrap" id="carrier-registration">
        <div className="shell driver-register-grid">
          <div className="driver-register-copy">
            <span className="eyebrow">JOIN THE AVL CARRIER NETWORK</span>
            <h2>Tell us what you can move.</h2>
            <p>Register your carrier business once. We’ll keep your details on file and make relevant open loads available through the opportunities board.</p>
            <div className="driver-requirements"><h3>Have these details handy</h3><ul><li>Carrier business name and contact email</li><li>MC number and USDOT number, if applicable</li><li>Vehicle and equipment you operate</li></ul></div>
            <div className="driver-local-note"><Truck size={21} aria-hidden="true" /><p><strong>Drive locally without an MC number?</strong> This form is currently for carrier businesses with an MC number. <a href="tel:+18283337155">Call (828) 333-7155</a> to discuss local delivery work.</p></div>
          </div>
          <div className="driver-form-card">
            <div className="driver-form-heading"><span className="eyebrow">CARRIER REGISTRATION</span><h2>Your carrier profile</h2><p>We’ll review your information before selecting you for a load.</p></div>
            {!isLoaded || (isSignedIn && loading) ? <p className="muted" role="status">Loading your profile…</p> : null}
            <Show when="signed-out"><div className="driver-auth"><p>Create a free account to save your carrier profile and see available opportunities.</p><SignUpButton mode="modal"><button className="primary" type="button">Create driver account <ArrowRight size={18} /></button></SignUpButton><span>Already have an account? <SignInButton mode="modal"><button className="driver-inline-button" type="button">Sign in</button></SignInButton></span></div></Show>
            <Show when="signed-in">
              {status && <div className="driver-status" role="status"><span className="driver-status-icon"><Check size={19} /></span><div><strong>{status === 'approved' ? 'Registration approved' : 'Registration received'}</strong><p>{status === 'approved' ? 'Your carrier details are on file.' : 'Your information is under review. You can browse open opportunities while we verify your details.'}</p></div></div>}
              {status !== 'approved' && <form onSubmit={submit} className="driver-form">
                <div className="fields"><label>Carrier business name<input required minLength={2} maxLength={150} autoComplete="organization" value={form.businessName} onChange={event => setForm({ ...form, businessName: event.target.value })} placeholder="Your registered business name" /></label><label>Business email<input required type="email" maxLength={200} autoComplete="email" value={form.contactEmail} onChange={event => setForm({ ...form, contactEmail: event.target.value })} placeholder="you@company.com" /></label><label>MC number<input required minLength={3} maxLength={30} value={form.mcNumber} onChange={event => setForm({ ...form, mcNumber: event.target.value })} placeholder="MC number" /></label><label>USDOT number <span className="optional">(if applicable)</span><input maxLength={30} value={form.dotNumber} onChange={event => setForm({ ...form, dotNumber: event.target.value })} placeholder="USDOT number" /></label><label className="full">Vehicles and equipment<input required minLength={3} maxLength={200} value={form.equipment} onChange={event => setForm({ ...form, equipment: event.target.value })} placeholder="Cargo van, pickup and trailer, box truck…" /></label></div>
                <button type="submit" className="primary" disabled={saving || loading}>{saving ? 'Saving your profile…' : status ? 'Update carrier profile' : 'Save carrier profile'} <ArrowRight size={18} aria-hidden="true" /></button>
                <p className="driver-form-note">Your profile is private. AVL reviews carrier details before choosing a provider for any job.</p>
              </form>}
              {status === 'approved' && <div className="driver-approved-profile"><p><strong>Carrier</strong><span>{form.businessName}</span></p><p><strong>MC number</strong><span>{form.mcNumber}</span></p><p><strong>Equipment</strong><span>{form.equipment}</span></p><p><strong>Contact</strong><span>{form.contactEmail}</span></p></div>}
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

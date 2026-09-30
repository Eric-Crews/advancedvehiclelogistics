'use client';

import { Show, SignInButton, SignUpButton, useAuth } from '@/components/auth/local-auth';
import { ArrowRight, Check, ClipboardCheck, MapPin, ShieldCheck, Truck } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState, type FormEvent } from 'react';
import { MarketHeader, MarketFooter } from '@/components/market-header';

type DriverProfile = {
  businessName: string;
  contactEmail: string;
  mcNumber: string;
  dotNumber: string | null;
  equipment: string;
  status: string;
  about: string; serviceArea: string; vehicleDetails: string; businessType: string; insuranceDescription: string;
  vehiclePhotoKey: string | null; profilePhotoKey: string | null;
};

const blank = { businessName: '', contactEmail: '', mcNumber: '', dotNumber: '', equipment: '', about: '', serviceArea: '', vehicleDetails: '', businessType: 'sole_proprietor', insuranceDescription: '' };

function DriverPhotoUpload({kind,exists,onSaved}:{kind:'vehicle'|'profile';exists:boolean;onSaved:()=>void}){
  const [busy,setBusy]=useState(false),[error,setError]=useState('');
  async function upload(file:File){setBusy(true);setError('');try{
    const bitmap=await createImageBitmap(file);const scale=Math.min(1,1200/Math.max(bitmap.width,bitmap.height));
    const canvas=document.createElement('canvas');canvas.width=Math.round(bitmap.width*scale);canvas.height=Math.round(bitmap.height*scale);
    const ctx=canvas.getContext('2d');if(!ctx)throw new Error('Could not process this image.');ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close();
    const blob=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error('Could not process this image.')),'image/webp',.82));
    if(blob.size>2_000_000)throw new Error('Choose a smaller image.');
    const response=await fetch(`/api/drivers/photos?kind=${kind}`,{method:'POST',headers:{'Content-Type':'image/webp'},body:blob});
    const data=await response.json() as {error?:string};if(!response.ok)throw new Error(data.error||'Upload failed.');onSaved();
  }catch(cause){setError(cause instanceof Error?cause.message:'Could not upload photo.')}finally{setBusy(false)}}
  return <div className="driver-photo-upload"><label>{kind==='vehicle'?'Vehicle photo':'Profile photo (optional)'}<input type="file" accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={event=>{const file=event.target.files?.[0];if(file)void upload(file)}} /></label><p>{exists?'Photo saved. Choose another to replace it.':'Choose a clear photo. Crop out license plates, business logos, phone numbers, and street addresses.'}</p>{error&&<p role="alert" className="notice error">{error}</p>}{busy&&<p role="status">Preparing and uploading photo…</p>}</div>
}

export default function DriversPage() {
  const { isLoaded, isSignedIn } = useAuth();
  const [form, setForm] = useState(blank);
  const [status, setStatus] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [photos,setPhotos]=useState({vehicle:false,profile:false}),[photoVersion,setPhotoVersion]=useState(0);

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
          about:driver.about||'',serviceArea:driver.serviceArea||'',vehicleDetails:driver.vehicleDetails||'',
          businessType:driver.businessType==='unspecified'?'sole_proprietor':driver.businessType,insuranceDescription:driver.insuranceDescription||'',
        });
        setPhotos({vehicle:Boolean(driver.vehiclePhotoKey),profile:Boolean(driver.profilePhotoKey)});
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
      setStatus(data.status || 'saved');
      setMessage('Your driver profile is saved. Add a vehicle photo to complete it.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not save your registration.');
    } finally {
      setSaving(false);
    }
  }

  return <>
    <MarketHeader />
    <main id="main-content">
      <section className="driver-hero driver-freight-hero">
        <div className="shell driver-freight-grid">
          <div className="driver-hero-copy">
            <span className="driver-kicker"><span /> AVL PRIVATE LOAD BOARD</span>
            <h1>Keep your truck moving. <em>Make every mile count.</em></h1>
            <p>Find smaller freight and hotshot opportunities that fit your equipment and route. Compare the trip, offer your rate, and look ahead for a load on the way back.</p>
            <div className="driver-hero-actions"><Link className="primary" href="/loads">View the load board <ArrowRight size={19} aria-hidden="true" /></Link><a className="driver-light-link" href="#carrier-registration">Join the network</a></div>
            <div className="driver-hero-facts"><span><Check size={17} /> Free driver registration</span><span><Check size={17} /> Review the load before you offer</span><span><Check size={17} /> Plan return miles</span></div>
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
        <div className="driver-intro-heading"><span className="eyebrow">BUILT AROUND THE WHOLE TRIP</span><h2>More than a pin on a map.</h2><p className="driver-intro-lead">The right load has to work for your truck, your schedule, and the miles you drive empty.</p></div>
        <div className="driver-intro-grid">
          <article><span className="driver-step-icon"><Truck size={23} /></span><strong>01 / FIT</strong><h3>Freight for your setup.</h3><p>Pickup truck, trailer, hotshot rig, cargo van, or box truck. Check weight, dimensions, and handling before you put your name in.</p></article>
          <article><span className="driver-step-icon"><MapPin size={23} /></span><strong>02 / LANE</strong><h3>Think beyond the delivery.</h3><p>Compare pickup and drop-off areas, timing, and any genuinely posted return opportunities. Decide whether the whole route works.</p></article>
          <article><span className="driver-step-icon"><ClipboardCheck size={23} /></span><strong>03 / TERMS</strong><h3>Offer a rate you can stand behind.</h3><p>Account for drive time, loading, equipment, and empty miles. The shipper chooses the driver and confirms the full terms directly.</p></article>
        </div>
      </section>

      <section className="driver-journey" aria-labelledby="driver-journey-title"><div className="shell driver-journey-layout"><div><span className="eyebrow">HOW IT WORKS FOR DRIVERS</span><h2 id="driver-journey-title">From open lane to agreed load.</h2><p>One place to check the opportunity. The shipper chooses the offer that works for the job.</p><Link className="driver-journey-link" href="/loads">Explore the board <ArrowRight size={18} aria-hidden="true" /></Link></div><ol><li><span>01</span><div><h3>Create your profile</h3><p>Tell us your vehicle, equipment, business details, and where you run.</p></div></li><li><span>02</span><div><h3>Review a posted summary</h3><p>Check the lane, load size, pickup window, and handling needs. Exact contacts stay private during browsing.</p></div></li><li><span>03</span><div><h3>Offer your rate</h3><p>Send a price and your availability. The shipper chooses an offer. You confirm the full scope and terms together.</p></div></li></ol></div></section>

      <section className="driver-register-wrap" id="carrier-registration">
        <div className="shell driver-register-grid">
          <div className="driver-register-copy">
            <span className="eyebrow">JOIN THE AVL DRIVER NETWORK</span>
            <h2>Tell us what you drive.</h2>
            <p>Build a private profile that shippers can review after you offer on their paid listing. Your profile is not a public directory page.</p>
            <div className="driver-requirements"><h3>Have these details handy</h3><ul><li>Business or driver name and contact email</li><li>MC and USDOT numbers, if applicable to your operation</li><li>Vehicle, equipment, service area, and a vehicle photo</li><li>Insurance description and an optional profile photo</li></ul></div>
            <div className="driver-local-note"><ShieldCheck size={21} aria-hidden="true" /><p><strong>Authority depends on the work.</strong> You can register a pickup or box truck without an MC number. Check the authority and insurance needed for each route and vehicle before offering.</p></div>
          </div>
          <div className="driver-form-card">
            <div className="driver-form-heading"><span className="eyebrow">DRIVER PROFILE</span><h2>Show how you work.</h2><p>Shippers see a limited profile when you offer. Your name and contact are shared after selection.</p></div>
            {!isLoaded || (isSignedIn && loading) ? <p className="muted" role="status">Loading your profile…</p> : null}
            <Show when="signed-out"><div className="driver-auth"><p>Create a free account to save your driver profile and see available opportunities.</p><SignUpButton mode="modal"><button className="primary" type="button">Create driver account <ArrowRight size={18} /></button></SignUpButton><span>Already have an account? <SignInButton mode="modal"><button className="driver-inline-button" type="button">Sign in</button></SignInButton></span></div></Show>
            <Show when="signed-in">
              {status && <div className="driver-status" role="status"><span className="driver-status-icon"><Check size={19} /></span><div><strong>Profile saved</strong><p>Add a vehicle photo before offering. Business and insurance details are self-reported.</p></div></div>}
              <form onSubmit={submit} className="driver-form">
                <div className="fields"><label>Business or driver name<input required minLength={2} maxLength={150} autoComplete="organization" value={form.businessName} onChange={event => setForm({ ...form, businessName: event.target.value })} placeholder="Name you operate under" /></label><label>Business email<input required type="email" maxLength={200} autoComplete="email" value={form.contactEmail} onChange={event => setForm({ ...form, contactEmail: event.target.value })} placeholder="you@company.com" /></label><label>MC number <span className="optional">(if applicable)</span><input maxLength={30} value={form.mcNumber} onChange={event => setForm({ ...form, mcNumber: event.target.value })} placeholder="MC number" /></label><label>USDOT number <span className="optional">(if applicable)</span><input maxLength={30} value={form.dotNumber} onChange={event => setForm({ ...form, dotNumber: event.target.value })} placeholder="USDOT number" /></label><label className="full">Vehicles and equipment<input required minLength={3} maxLength={200} value={form.equipment} onChange={event => setForm({ ...form, equipment: event.target.value })} placeholder="Pickup, 24-ft flatbed, 16-ft box truck…" /></label></div>
                <div className="driver-profile-extra"><label className="full">About your work<textarea maxLength={700} value={form.about} onChange={event=>setForm({...form,about:event.target.value})} placeholder="What you haul, your experience, and how you handle a shipment" /></label><label>Service areas and regular lanes<input maxLength={160} value={form.serviceArea} onChange={event=>setForm({...form,serviceArea:event.target.value})} placeholder="Carolinas, Southeast, Asheville–Austin…" /></label><label>Vehicle details<input maxLength={250} value={form.vehicleDetails} onChange={event=>setForm({...form,vehicleDetails:event.target.value})} placeholder="2021 F-350, 24-ft flatbed, 10,000-lb capacity" /></label><label>Business structure<select value={form.businessType} onChange={event=>setForm({...form,businessType:event.target.value})}><option value="sole_proprietor">Sole proprietor</option><option value="llc">LLC</option><option value="corporation">Corporation</option><option value="other">Other</option></select></label><label>Insurance you carry<input maxLength={250} value={form.insuranceDescription} onChange={event=>setForm({...form,insuranceDescription:event.target.value})} placeholder="Commercial auto, cargo, coverage limits…" /><small>Self-reported. Do not include policy numbers.</small></label></div>
                <button type="submit" className="primary" disabled={saving || loading}>{saving ? 'Saving your profile…' : status ? 'Update driver profile' : 'Save driver profile'} <ArrowRight size={18} aria-hidden="true" /></button>
                <p className="driver-form-note">Your profile appears only to shippers whose paid listing you respond to. Contact details remain hidden until selection.</p>
              </form>
              {status&&<div className="driver-photos"><h3>Photos</h3><p>Only shippers whose paid listing you respond to can view these. Photos are not shown on the public board.</p><div>{photos.vehicle&&<img src={`/api/drivers/photos?kind=vehicle&v=${photoVersion}`} alt="Your vehicle" />}{photos.profile&&<img src={`/api/drivers/photos?kind=profile&v=${photoVersion}`} alt="Your profile" />}</div><DriverPhotoUpload kind="vehicle" exists={photos.vehicle} onSaved={()=>{setPhotos({...photos,vehicle:true});setPhotoVersion(v=>v+1)}}/><DriverPhotoUpload kind="profile" exists={photos.profile} onSaved={()=>{setPhotos({...photos,profile:true});setPhotoVersion(v=>v+1)}}/></div>}
              {error && <p className="notice error" role="alert">{error}</p>}
              {message && <p className="notice success" role="status">{message}</p>}
              {status && <Link href="/loads" className="driver-opportunities-link">View open opportunities <ArrowRight size={18} aria-hidden="true" /></Link>}
            </Show>
            <p className="driver-payout-note">Shippers and drivers agree on delivery payment directly. AVL does not collect or distribute driver pay.</p>
          </div>
        </div>
      </section>
      <section className="shell driver-close"><div><span className="eyebrow">QUESTIONS BEFORE YOU JOIN?</span><h2>Let’s talk about your operation.</h2><p>Tell us what you drive, where you work, and what types of loads fit your setup.</p></div><a className="secondary" href="tel:+18283337155">Call (828) 333-7155 <ArrowRight size={18} /></a></section>
    </main>
    <MarketFooter />
  </>;
}

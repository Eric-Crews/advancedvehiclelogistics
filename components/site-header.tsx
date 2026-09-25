'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Show, SignInButton, UserButton } from '@clerk/nextjs';
import { ArrowRight, Menu, X } from 'lucide-react';
import { Brand } from './brand';

export type SiteView = 'request' | 'mine' | 'board' | 'review' | 'how';
export function SiteHeader({ onNavigate, admin = false, active = 'request' }: { onNavigate?: (page: SiteView) => void; admin?: boolean; active?: SiteView }) {
  const [open, setOpen] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);
  useEffect(() => { function close(event: KeyboardEvent) { if (event.key === 'Escape' && open) { setOpen(false); toggle.current?.focus(); } } window.addEventListener('keydown', close); return () => window.removeEventListener('keydown', close); }, [open]);
  function go(page: SiteView) { setOpen(false); if (onNavigate) onNavigate(page); else window.location.href = page === 'request' ? '/' : page === 'review' ? '/desk' : `/?view=${page}`; }
  return <header className="top"><div className="shell nav"><Link className="brand" href="/" aria-label="Advanced Vehicle Logistics home"><Brand /></Link><nav id="main-navigation" className={'desktop-nav ' + (open ? 'mobile-open' : '')} aria-label="Main navigation"><button aria-current={active === 'request' ? 'page' : undefined} onClick={() => go('request')}>Delivery</button><button aria-current={active === 'how' ? 'page' : undefined} onClick={() => go('how')}>How it works</button><button aria-current={active === 'board' ? 'page' : undefined} onClick={() => go('board')}>For drivers</button><button className="mobile-requests" onClick={() => go('mine')}>My requests</button>{admin && <button onClick={() => go('review')}>Quote desk</button>}</nav><div className="nav-account"><button className="nav-text" onClick={() => go('mine')}>My requests</button><Show when="signed-out"><SignInButton mode="modal"><button className="nav-signin">Sign in</button></SignInButton></Show><Show when="signed-in"><UserButton /></Show><button className="nav-quote primary" onClick={() => { go('request'); window.setTimeout(() => document.getElementById('delivery-estimate')?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' }), 0); }}>Get a quote <ArrowRight size={17} aria-hidden="true" /></button><button ref={toggle} className="mobile-toggle" onClick={() => setOpen(!open)} aria-label={open ? 'Close navigation' : 'Open navigation'} aria-expanded={open} aria-controls="main-navigation">{open ? <X size={24} /> : <Menu size={24} />}</button></div></div></header>;
}

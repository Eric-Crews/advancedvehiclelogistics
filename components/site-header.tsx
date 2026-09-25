'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Show, SignInButton, UserButton } from '@clerk/nextjs';
import { ArrowRight, ArrowUpRight, Menu, Phone, X } from 'lucide-react';
import { AvlMark } from '@/components/avl-mark';

export type SiteView = 'request' | 'mine' | 'board' | 'review' | 'how';

export function SiteHeader({ onNavigate, admin = false, active = 'request' }: { onNavigate?: (page: SiteView) => void; admin?: boolean; active?: SiteView }) {
  const [open, setOpen] = useState(false);
  function go(page: SiteView) {
    setOpen(false);
    if (onNavigate) onNavigate(page);
    else window.location.href = page === 'request' ? '/' : page === 'review' ? '/desk' : `/?view=${page}`;
  }
  return <header className="top">
    <div className="nav-utility"><div className="shell"><span>Asheville based. Here to help you get it there.</span><a href="tel:+18283337155"><Phone size={13} /> (828) 333-7155</a></div></div>
    <div className="shell nav">
      <Link className="brand" href="/" aria-label="Advanced Vehicle Logistics home"><span className="brand-emblem"><AvlMark /></span><span className="brand-name"><strong>AVL</strong><small>ADVANCED VEHICLE LOGISTICS</small></span></Link>
      <nav className={'desktop-nav ' + (open ? 'mobile-open' : '')} aria-label="Main navigation">
        <button className={active === 'request' ? 'active' : ''} onClick={() => go('request')}>Delivery</button>
        <button className={active === 'how' ? 'active' : ''} onClick={() => go('how')}>How it works</button>
        <button className={active === 'board' ? 'active' : ''} onClick={() => go('board')}>For drivers <ArrowUpRight size={14} /></button>
        <button className="mobile-requests" onClick={() => go('mine')}>My requests</button>
        {admin && <button onClick={() => go('review')}>Review desk</button>}
        <button className="mobile-quote" onClick={() => go('request')}>Get a quote <ArrowRight size={16} /></button>
      </nav>
      <div className="nav-account">
        <button className="nav-text" onClick={() => go('mine')}>My requests</button>
        <Show when="signed-out"><SignInButton mode="modal"><button className="nav-signin">Sign in</button></SignInButton></Show>
        <Show when="signed-in"><UserButton /></Show>
        <button className="nav-quote primary" onClick={() => go('request')}>Get a quote <ArrowRight size={16} /></button>
        <button className="mobile-toggle" onClick={() => setOpen(!open)} aria-label={open ? 'Close navigation' : 'Open navigation'} aria-expanded={open}>{open ? <X size={23} /> : <Menu size={23} />}</button>
      </div>
    </div>
  </header>;
}

import Link from 'next/link';
import { Brand } from './brand';

export function DriverFooter() {
  return <footer className="foot"><div className="shell footer-top"><Link className="brand" href="/" aria-label="Advanced Vehicle Logistics home"><Brand /></Link><p>Good deliveries start with the right people.</p><div><Link href="/">Request a delivery</Link><Link href="/drivers">For drivers</Link><a href="tel:+18283337155">(828) 333-7155</a></div></div><div className="shell footer-bottom"><span>© {new Date().getFullYear()} Advanced Vehicle Logistics</span><span>Carrier opportunities are reviewed individually</span></div></footer>;
}

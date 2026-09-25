import type { PublicPricing } from './job-estimate';
export function priceRange(p: Pick<PublicPricing, 'lowCents' | 'highCents'>): string {
  if (p.lowCents === null || p.highCents === null) return 'AVL review needed';
  const money = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n / 100);
  return p.lowCents === p.highCents ? money(p.lowCents) : `${money(p.lowCents)}–${money(p.highCents)}`;
}

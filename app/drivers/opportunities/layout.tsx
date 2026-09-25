import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Carrier opportunities | Advanced Vehicle Logistics', robots: { index: false, follow: false } };

export default function OpportunitiesLayout({ children }: { children: React.ReactNode }) {
  return children;
}

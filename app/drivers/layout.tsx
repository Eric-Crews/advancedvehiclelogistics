import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Drive with AVL | Advanced Vehicle Logistics',
  description: 'Register your carrier business and see reviewed specialty delivery opportunities with Advanced Vehicle Logistics.',
};

export default function DriversLayout({ children }: { children: React.ReactNode }) {
  return children;
}

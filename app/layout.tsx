import type { Metadata } from 'next';
import './globals.css';
import { ClerkProvider } from '@clerk/nextjs';
import { shadcn } from '@clerk/ui/themes';
export const metadata: Metadata = { title:'Advanced Vehicle Logistics | Everyday delivery, anywhere you are', description:'Request delivery for furniture, Marketplace finds, lumber, garden supplies, and more across the U.S. Estimates based on crew, handling, access, and travel, with a $60 job minimum. Availability confirmed for your route.', icons:{icon:'/favicon.svg'} };
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body><ClerkProvider appearance={{ theme: shadcn }}>{children}</ClerkProvider></body></html>}

import type { Metadata } from 'next';
import './globals.css';
import { ClerkProvider } from '@clerk/nextjs';
import { shadcn } from '@clerk/ui/themes';
export const metadata: Metadata = { title:'Advanced Vehicle Logistics | Easy delivery quotes', description:'Request a delivery quote for furniture, Marketplace finds, lumber, landscaping supplies, and more. A person checks the best option for your delivery.', icons:{icon:'/favicon.svg'} };
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body><ClerkProvider appearance={{ theme: shadcn }}>{children}</ClerkProvider></body></html>}

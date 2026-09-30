import type { Metadata } from 'next';
import './globals.css';
import { ClerkProvider } from '@clerk/nextjs';
import { shadcn } from '@clerk/ui/themes';
export const metadata: Metadata = { title:'Advanced Vehicle Logistics | Private-party loads and driver routes', description:'Post a private-party load for review or explore routes for pickup, hotshot, cargo van, and box truck drivers. AVL confirms shipment details and quotes before booking.', icons:{icon:'/favicon.svg'} };
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body><ClerkProvider appearance={{ theme: shadcn }}>{children}</ClerkProvider></body></html>}

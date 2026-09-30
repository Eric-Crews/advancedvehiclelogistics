import type { Metadata } from 'next';
import './globals.css';
import { ClerkProvider } from '@clerk/nextjs';
import { shadcn } from '@clerk/ui/themes';
export const metadata: Metadata = { title:'Advanced Vehicle Logistics | Private-party loads and driver routes', description:'Post smaller freight, set an offered delivery price, and compare direct driver offers. A flat listing fee publishes your load; shippers and drivers agree on delivery terms directly.', icons:{icon:'/favicon.svg'} };
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body><ClerkProvider appearance={{ theme: shadcn }}>{children}</ClerkProvider></body></html>}

import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/components/auth/local-auth';
export const metadata: Metadata = { title:'Advanced Vehicle Logistics | Private-party loads and driver routes', description:'Post smaller freight, set an offered delivery price, and compare direct driver offers. A flat listing fee publishes your load; shippers and drivers agree on delivery terms directly.', icons:{icon:'/favicon.svg'} };
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body><AuthProvider>{children}</AuthProvider></body></html>}

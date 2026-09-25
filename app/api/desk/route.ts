import { NextResponse } from 'next/server';
import { isOperator } from '@/lib/operator';
import { db } from '@/lib/desk-db';
import { paymentsConfigured } from '@/lib/stripe';
import { emailConfigured } from '@/lib/notifications';
export const dynamic='force-dynamic';
export async function GET(){
 if(!await isOperator())return NextResponse.json({error:'Sign in with the AVL owner account to open the quote desk.'},{status:403});
 try{
  const loads=await db().prepare(`SELECT l.id,l.title,l.origin,l.destination,l.contact_name,l.status,l.booking_status,l.created_at,q.price_cents,q.status AS quote_status FROM loads l LEFT JOIN delivery_quotes q ON q.id=l.current_quote_id ORDER BY l.id DESC LIMIT 200`).all();
  return NextResponse.json({loads:loads.results,integrations:{payments:paymentsConfigured(),email:emailConfigured(),providerRates:'manual'}});
 }catch{return NextResponse.json({error:'Quote desk is temporarily unavailable.'},{status:503})}
}

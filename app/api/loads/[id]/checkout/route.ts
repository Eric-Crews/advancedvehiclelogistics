import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { db } from '@/lib/desk-db';
import { paymentsConfigured,stripeClient } from '@/lib/stripe';
import { siteUrl } from '@/lib/notifications';
import { applyCheckoutSession } from '@/lib/payment-events';
import type { DeskQuote } from '@/lib/desk-types';
export const dynamic='force-dynamic';
export async function POST(req:Request,{params}:{params:Promise<{id:string}>}){
 const {userId}=await auth();if(!userId)return NextResponse.json({error:'Sign in to pay your quote.'},{status:401});
 if(!paymentsConfigured())return NextResponse.json({error:'Online payment is not available yet. Contact AVL to arrange payment.'},{status:503});
 const {id}=await params;const input=await req.json().catch(()=>null) as {quoteId?:unknown}|null;if(!/^\d+$/.test(id)||typeof input?.quoteId!=='string')return NextResponse.json({error:'Invalid request.'},{status:400});
 try{
  type PayQuote=DeskQuote&{attempt_id:string|null;contact_email:string;title:string};
  let quote=await db().prepare('SELECT q.*,l.contact_email,l.title FROM delivery_quotes q JOIN loads l ON l.current_quote_id=q.id WHERE l.id=? AND l.customer_clerk_id=? AND q.id=?').bind(Number(id),userId,input.quoteId).first<PayQuote>();
  if(!quote)return NextResponse.json({error:'This quote is no longer current.'},{status:409});
  if(quote.status==='paid')return NextResponse.json({url:`${siteUrl()}/?view=mine`});
  if(!['sent','checkout'].includes(quote.status))return NextResponse.json({error:'This quote cannot be paid. Refresh for the latest status.'},{status:409});
  const stripe=stripeClient();
  if(quote.status==='sent'){
   const attempt=`${crypto.randomUUID()}_${Math.floor(Date.now()/1000)}`;
   await db().prepare("UPDATE delivery_quotes SET status='checkout',attempt_id=? WHERE id=? AND status='sent' AND expires_at>? AND id=(SELECT current_quote_id FROM loads WHERE id=?)").bind(attempt,quote.id,new Date(Date.now()+31*60000).toISOString(),Number(id)).run();
   quote=await db().prepare('SELECT q.*,l.contact_email,l.title FROM delivery_quotes q JOIN loads l ON l.current_quote_id=q.id WHERE l.id=? AND q.id=? AND l.customer_clerk_id=?').bind(Number(id),quote.id,userId).first<PayQuote>();
  }
  if(!quote||quote.status!=='checkout'||!quote.attempt_id)return NextResponse.json({error:'This quote is expired or too close to expiration. Please ask AVL to refresh it.'},{status:409});
  if(quote.stripe_session_id){
   const existing=await stripe.checkout.sessions.retrieve(quote.stripe_session_id);
   if(existing.status==='open'&&existing.url)return NextResponse.json({url:existing.url});
   await applyCheckoutSession(existing,existing.status==='expired'?'checkout.session.expired':'checkout.session.completed');
   return NextResponse.json({url:`${siteUrl()}/?view=mine`});
  }
  const attemptTime=Number(quote.attempt_id.split('_').at(-1));
  const expires=Math.min(Math.floor(Date.parse(quote.expires_at)/1000),attemptTime+23*3600);
  const session=await stripe.checkout.sessions.create({
   mode:'payment',integration_identifier:'avl_quote_desk_nqvtrpaz',client_reference_id:quote.id,customer_email:quote.contact_email,
   line_items:[{quantity:1,price_data:{currency:'usd',unit_amount:quote.price_cents,product_data:{name:`AVL delivery #${id}: ${quote.title}`,description:quote.scope.slice(0,500)}}}],
   metadata:{avl_quote_id:quote.id,avl_attempt_id:quote.attempt_id},payment_intent_data:{metadata:{avl_quote_id:quote.id}},
   expires_at:expires,success_url:`${siteUrl()}/?view=mine&payment=returned`,cancel_url:`${siteUrl()}/?view=mine&payment=cancelled`,
  },{idempotencyKey:`avl-checkout-${quote.attempt_id}`});
  await db().prepare("UPDATE delivery_quotes SET stripe_session_id=?,checkout_url=? WHERE id=? AND attempt_id=? AND status IN ('checkout','processing','paid')").bind(session.id,session.url,quote.id,quote.attempt_id).run();
  if(!session.url)throw new Error('Checkout URL unavailable');
  return NextResponse.json({url:session.url});
 }catch(error){console.error('Checkout unavailable',error instanceof Error?error.name:'error');return NextResponse.json({error:'We could not open checkout. Your quote is saved; retry to resume the same payment.'},{status:503})}
}

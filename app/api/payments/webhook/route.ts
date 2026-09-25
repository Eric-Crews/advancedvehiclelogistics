import Stripe from 'stripe';
import { NextResponse } from 'next/server';
import { stripeClient } from '@/lib/stripe';
import { applyCheckoutSession } from '@/lib/payment-events';
import { db } from '@/lib/desk-db';
export const dynamic='force-dynamic';
export async function POST(req:Request){
 if(!process.env.STRIPE_WEBHOOK_SECRET||!process.env.STRIPE_SECRET_KEY)return NextResponse.json({error:'Webhook not configured'},{status:503});
 let event:Stripe.Event;
 try{event=await stripeClient().webhooks.constructEventAsync(await req.text(),req.headers.get('stripe-signature')||'',process.env.STRIPE_WEBHOOK_SECRET,undefined,Stripe.createSubtleCryptoProvider())}
 catch{return NextResponse.json({error:'Invalid signature'},{status:400})}
 try{
  if(['checkout.session.completed','checkout.session.async_payment_succeeded','checkout.session.async_payment_failed','checkout.session.expired'].includes(event.type)){
   await applyCheckoutSession(event.data.object as Stripe.Checkout.Session,event.type);
  }else if(event.type==='charge.refunded'){
   const charge=event.data.object as Stripe.Charge;
   const intent=typeof charge.payment_intent==='string'?charge.payment_intent:charge.payment_intent?.id;
   if(intent&&charge.refunded){await db().batch([
    db().prepare("UPDATE delivery_quotes SET status='refunded' WHERE stripe_payment_intent=? AND status='paid'").bind(intent),
    db().prepare("UPDATE loads SET status='payment_refunded' WHERE current_quote_id IN (SELECT id FROM delivery_quotes WHERE stripe_payment_intent=? AND status='refunded')").bind(intent),
   ])}
  }
  return NextResponse.json({received:true});
 }catch{return NextResponse.json({error:'Payment update could not be saved; retry required.'},{status:500})}
}

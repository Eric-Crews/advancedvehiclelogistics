import { NextResponse } from 'next/server';
import { z } from 'zod';
import { isOperator } from '@/lib/operator';
import { db, audit, now } from '@/lib/desk-db';
import { queueEmail, notifySafely, siteUrl } from '@/lib/notifications';
import { stripeClient } from '@/lib/stripe';
import { providers, money } from '@/lib/quote-math';
import type { DeskLoad,DeskQuote,DeliveryOption } from '@/lib/desk-types';
export const dynamic='force-dynamic';
type Context={params:Promise<{id:string}>};
const amount=z.number().int().min(0).max(100000000);
const schema=z.discriminatedUnion('action',[
 z.object({action:z.literal('option'),provider:z.enum(providers),costCents:amount,extraCents:amount,service:z.string().trim().min(3).max(300),timing:z.string().trim().min(3).max(300),availability:z.enum(['unconfirmed','confirmed','unavailable']),validUntil:z.string().datetime().nullable(),internalNote:z.string().trim().max(2000)}),
 z.object({action:z.literal('quote'),optionId:z.string().uuid(),expectedQuoteId:z.string().nullable(),priceCents:amount.min(100),feeBps:z.number().int().min(0).max(2000),fixedFeeCents:amount.max(10000),scope:z.string().trim().min(10).max(2000),timing:z.string().trim().min(3).max(300),expiresAt:z.string().datetime()}),
 z.object({action:z.literal('manual_payment'),quoteId:z.string(),amountCents:amount.min(100),reference:z.string().trim().min(3).max(200),confirmed:z.literal(true)}),
 z.object({action:z.literal('booking'),status:z.enum(['booked','in_transit','delivered','issue']),provider:z.string().trim().min(2).max(100),reference:z.string().trim().min(2).max(200),customerNote:z.string().trim().min(5).max(1000),actualCostCents:amount.nullable()}),
 z.object({action:z.literal('note'),note:z.string().trim().min(3).max(2000)}),
 z.object({action:z.literal('void_quote'),quoteId:z.string()}),
 z.object({action:z.literal('retry_email'),notificationId:z.string(),confirmed:z.literal(true)}),
]);
const fail=(error:string,status=400)=>NextResponse.json({error},{status});
export async function GET(_req:Request,{params}:Context){
 if(!await isOperator())return fail('Owner access required.',403);
 const {id}=await params;if(!/^\d+$/.test(id))return fail('Invalid request');
 try{
  const load=await db().prepare('SELECT * FROM loads WHERE id=?').bind(Number(id)).first();if(!load)return fail('Request not found',404);
  const [options,quotes,events,notifications]=await Promise.all([
   db().prepare('SELECT * FROM delivery_options WHERE load_id=? ORDER BY created_at DESC').bind(Number(id)).all(),
   db().prepare('SELECT * FROM delivery_quotes WHERE load_id=? ORDER BY created_at DESC').bind(Number(id)).all(),
   db().prepare('SELECT * FROM desk_events WHERE load_id=? ORDER BY id DESC LIMIT 100').bind(Number(id)).all(),
   db().prepare('SELECT id,recipient,subject,status,error,created_at FROM notifications WHERE load_id=? ORDER BY created_at DESC LIMIT 50').bind(Number(id)).all(),
  ]);
  return NextResponse.json({load,options:options.results,quotes:quotes.results,events:events.results,notifications:notifications.results});
 }catch{return fail('Could not load request.',503)}
}
export async function POST(req:Request,{params}:Context){
 if(!await isOperator())return fail('Owner access required.',403);
 const {id:raw}=await params;if(!/^\d+$/.test(raw))return fail('Invalid request');const id=Number(raw);
 const parsed=schema.safeParse(await req.json().catch(()=>null));if(!parsed.success)return fail('Check the fields and try again.');const d=parsed.data;
 try{
  const load=await db().prepare('SELECT * FROM loads WHERE id=?').bind(id).first<DeskLoad>();if(!load)return fail('Request not found.',404);
  const stamp=now();
  if(d.action==='option'){
   await db().batch([db().prepare('INSERT INTO delivery_options (id,load_id,provider,cost_cents,extra_cents,service,timing,availability,valid_until,internal_note,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)').bind(crypto.randomUUID(),id,d.provider,d.costCents,d.extraCents,d.service,d.timing,d.availability,d.validUntil,d.internalNote,stamp),audit(id,'AVL owner',`Added ${d.provider} option at ${money(d.costCents+d.extraCents)}; ${d.availability}.`)]);
  }else if(d.action==='quote'){
   const expires=Date.parse(d.expiresAt);if(expires<Date.now()+3600000||expires>Date.now()+7*86400000)return fail('Quote expiration must be between 1 hour and 7 days from now.');
   const option=await db().prepare('SELECT * FROM delivery_options WHERE id=? AND load_id=?').bind(d.optionId,id).first<DeliveryOption>();
   if(!option||option.availability!=='confirmed')return fail('Choose an option with confirmed availability before sending.');
   if(option.valid_until&&option.valid_until<d.expiresAt)return fail('The quote cannot outlast the provider’s rate validity.');
   const qid=crypto.randomUUID(),emailId=`quote:${qid}`;
   const results=await db().batch([
    db().prepare(`INSERT INTO delivery_quotes (id,load_id,option_id,provider,cost_cents,extra_cents,price_cents,fee_bps,fixed_fee_cents,scope,timing,expires_at,status,created_at) SELECT ?,l.id,?,?,?,?,?,?,?,?,?,?,'sent',? FROM loads l LEFT JOIN delivery_quotes q ON q.id=l.current_quote_id WHERE l.id=? AND l.current_quote_id IS ? AND l.booking_status='not_booked' AND l.status NOT IN ('closed','paid','booked','in_transit','delivered') AND (q.id IS NULL OR q.status IN ('sent','expired','superseded','failed'))`).bind(qid,option.id,option.provider,option.cost_cents,option.extra_cents,d.priceCents,d.feeBps,d.fixedFeeCents,d.scope,d.timing,d.expiresAt,stamp,id,d.expectedQuoteId),
    db().prepare("UPDATE delivery_quotes SET status='superseded' WHERE id=? AND EXISTS (SELECT 1 FROM delivery_quotes WHERE id=?)").bind(d.expectedQuoteId,qid),
    db().prepare("UPDATE loads SET current_quote_id=?,status='quote_ready',quote_cents=?,quote_note=?,quote_source=NULL,quoted_at=? WHERE id=? AND EXISTS (SELECT 1 FROM delivery_quotes WHERE id=?)").bind(qid,d.priceCents,d.scope,stamp,id,qid),
    db().prepare("INSERT INTO desk_events (load_id,actor,message,created_at) SELECT ?,'AVL owner',?,? WHERE EXISTS (SELECT 1 FROM delivery_quotes WHERE id=?)").bind(id,`Published AVL quote for ${money(d.priceCents)}.`,stamp,qid),
    db().prepare("INSERT INTO notifications (id,load_id,recipient,subject,body,status,created_at) SELECT ?,?,?,?,?, 'pending',? WHERE EXISTS (SELECT 1 FROM delivery_quotes WHERE id=?)").bind(emailId,id,load.contact_email,`Your AVL delivery quote #${id}`,`Your delivery quote is ${money(d.priceCents)}.\n\n${d.scope}\n\nTiming: ${d.timing}\nValid until: ${new Date(d.expiresAt).toLocaleString('en-US',{timeZone:'America/New_York'})} Eastern Time.\n\nReview your quote and payment options: ${siteUrl()}/?view=mine\n\nAVL: (828) 333-7155`,stamp,qid),
   ]);
   if(!results[0].meta.changes)return fail('This request changed or payment has started. Refresh before sending a new quote.',409);
   return NextResponse.json({ok:true,message:'Quote published to the customer account.',email:await notifySafely(emailId)});
  }else if(d.action==='manual_payment'){
   const result=await db().prepare("UPDATE delivery_quotes SET status='paid',paid_at=?,payment_method='external',payment_reference=? WHERE id=? AND load_id=? AND price_cents=? AND status='sent' AND expires_at>? AND id=(SELECT current_quote_id FROM loads WHERE id=?) RETURNING id").bind(stamp,d.reference,d.quoteId,id,d.amountCents,stamp,id).first();
   if(!result)return fail('Only the current, unexpired quote without an active checkout can receive a manual payment record.',409);
   await db().batch([db().prepare("UPDATE loads SET status='paid' WHERE id=? AND current_quote_id=?").bind(id,d.quoteId),audit(id,'AVL owner',`Recorded external payment ${money(d.amountCents)}. Reference: ${d.reference}.`)]);
  }else if(d.action==='booking'){
   const transitions:Record<string,string[]>={not_booked:['booked','issue'],booked:['booked','in_transit','issue'],in_transit:['in_transit','delivered','issue'],issue:['issue','booked','in_transit'],delivered:['delivered']};
   if(!transitions[load.booking_status]?.includes(d.status))return fail('Use the next booking stage. A delivery must be booked before it can be marked in transit or delivered.');
   const result=await db().prepare(`UPDATE loads SET booking_status=?,status=?,booked_provider=?,booking_reference=?,booking_note=?,actual_cost_cents=?,booked_at=COALESCE(booked_at,?) WHERE id=? AND booking_status=? AND EXISTS (SELECT 1 FROM delivery_quotes q WHERE q.id=loads.current_quote_id AND q.status='paid') RETURNING id`).bind(d.status,d.status==='issue'?'delivery_issue':d.status,d.provider,d.reference,d.customerNote,d.actualCostCents,stamp,id,load.booking_status).first();
   if(!result)return fail('Verified payment is required before booking. Refresh if the request changed.',409);
   const emailId=crypto.randomUUID();await db().batch([audit(id,'AVL owner',`Booking ${d.status}; ${d.provider}; reference ${d.reference}.`),queueEmail(emailId,id,load.contact_email,`AVL delivery #${id}: ${d.status.replaceAll('_',' ')}`,`${d.customerNote}\n\nView your delivery: ${siteUrl()}/?view=mine\nAVL: (828) 333-7155`)]);await notifySafely(emailId);
  }else if(d.action==='note'){
   await audit(id,'AVL owner',d.note).run();
  }else if(d.action==='retry_email'){
   const email=await db().prepare('SELECT id FROM notifications WHERE id=? AND load_id=?').bind(d.notificationId,id).first();if(!email)return fail('Notification not found',404);
   return NextResponse.json({ok:true,email:await notifySafely(d.notificationId)});
  }else if(d.action==='void_quote'){
   const quote=await db().prepare('SELECT * FROM delivery_quotes WHERE id=? AND load_id=?').bind(d.quoteId,id).first<DeskQuote>();if(!quote)return fail('Quote not found',404);
   if(quote.status==='checkout'){
    if(!quote.stripe_session_id)return fail('Checkout is initializing. Try again shortly.',409);
    const stripe=stripeClient();const session=await stripe.checkout.sessions.retrieve(quote.stripe_session_id);
    if(session.status==='complete')return fail('Payment is complete or processing. Refresh payment status before changing the quote.',409);
    if(session.status==='open')await stripe.checkout.sessions.expire(session.id);
   }
   const result=await db().prepare("UPDATE delivery_quotes SET status='expired' WHERE id=? AND status IN ('sent','checkout','failed') RETURNING id").bind(d.quoteId).first();
   if(!result)return fail('Paid or processing quotes cannot be withdrawn.',409);
   await db().batch([db().prepare("UPDATE loads SET status='broker_review' WHERE id=? AND current_quote_id=?").bind(id,d.quoteId),audit(id,'AVL owner','Withdrew the unpaid quote. A new quote is needed before payment.')]);
  }
  return NextResponse.json({ok:true});
 }catch(error){console.error('Quote desk action failed',error instanceof Error?error.name:'error');return fail('Could not complete this action. Refresh to check its status before retrying.',503)}
}

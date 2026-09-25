import type Stripe from 'stripe';
import { db,now } from './desk-db';
import { queueEmail,notifySafely,siteUrl } from './notifications';
import type { DeskQuote } from './desk-types';
export async function applyCheckoutSession(session:Stripe.Checkout.Session,eventType:string){
 const quoteId=session.metadata?.avl_quote_id,attempt=session.metadata?.avl_attempt_id;
 if(!quoteId||!attempt)return;
 const quote=await db().prepare('SELECT * FROM delivery_quotes WHERE id=?').bind(quoteId).first<DeskQuote & {attempt_id:string}>();
 if(!quote||quote.attempt_id!==attempt)return;
 if(session.currency!=='usd'||session.amount_total!==quote.price_cents||session.mode!=='payment')throw new Error('Payment does not match quote');
 if(quote.stripe_session_id&&quote.stripe_session_id!==session.id)throw new Error('Checkout session mismatch');
 const stamp=now();
 if(session.payment_status==='paid'){
  const intent=typeof session.payment_intent==='string'?session.payment_intent:session.payment_intent?.id||null;
  const emailId=`paid:${quoteId}`;
  await db().batch([
   db().prepare("UPDATE delivery_quotes SET status='paid',paid_at=?,stripe_session_id=?,stripe_payment_intent=?,payment_method='stripe',payment_reference=? WHERE id=? AND attempt_id=? AND status IN ('checkout','processing')").bind(stamp,session.id,intent,intent||session.id,quoteId,attempt),
   db().prepare("UPDATE loads SET status='paid' WHERE current_quote_id=? AND status NOT IN ('booked','in_transit','delivered','delivery_issue','payment_refunded') AND EXISTS (SELECT 1 FROM delivery_quotes WHERE id=? AND status='paid')").bind(quoteId,quoteId),
   db().prepare("INSERT INTO desk_events (load_id,actor,message,created_at) SELECT ?,'Stripe','Payment verified. Ready for AVL to arrange delivery.',? WHERE EXISTS (SELECT 1 FROM delivery_quotes WHERE id=? AND paid_at=?) AND NOT EXISTS (SELECT 1 FROM notifications WHERE id=?)").bind(quote.load_id,stamp,quoteId,stamp,emailId),
   db().prepare("INSERT OR IGNORE INTO notifications (id,load_id,recipient,subject,body,status,created_at) SELECT ?,?,?,?,?,'pending',? WHERE EXISTS (SELECT 1 FROM delivery_quotes WHERE id=? AND status='paid')").bind(emailId,quote.load_id,process.env.AVL_ADMIN_EMAIL||'',`Payment received for AVL request #${quote.load_id}`,`Payment is verified. Arrange the delivery and record the booking: ${siteUrl()}/desk?request=${quote.load_id}`,stamp,quoteId),
  ]);
  await notifySafely(emailId);
 }else if(eventType==='checkout.session.async_payment_failed'){
  await db().prepare("UPDATE delivery_quotes SET status='failed',stripe_session_id=? WHERE id=? AND status IN ('checkout','processing')").bind(session.id,quoteId).run();
 }else if(eventType==='checkout.session.expired'){
  await db().prepare("UPDATE delivery_quotes SET status='expired',stripe_session_id=? WHERE id=? AND status='checkout'").bind(session.id,quoteId).run();
 }else if(session.status==='complete'){
  await db().prepare("UPDATE delivery_quotes SET status='processing',stripe_session_id=? WHERE id=? AND status='checkout'").bind(session.id,quoteId).run();
 }
}

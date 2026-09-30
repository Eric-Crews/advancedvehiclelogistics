import { auth } from '@/lib/local-auth';
import { NextResponse } from 'next/server';
import { db } from '@/lib/desk-db';
import { feeCents } from '@/lib/market';
import { stripeClient } from '@/lib/stripe';
export const dynamic = 'force-dynamic';
export async function POST(_req: Request,{params}:{params:Promise<{id:string}>}) {
  const {userId}=await auth();if(!userId)return NextResponse.json({error:'Sign in to publish your listing.'},{status:401});
  const id=Number((await params).id);if(!Number.isSafeInteger(id)||id<1)return NextResponse.json({error:'Invalid listing.'},{status:400});
  if(!process.env.STRIPE_SECRET_KEY||!process.env.STRIPE_WEBHOOK_SECRET||!process.env.AVL_PUBLIC_URL?.startsWith('https://'))return NextResponse.json({error:'Listing checkout is being configured. Your draft is saved; please return shortly.'},{status:503});
  try {
    const listing=await db().prepare('SELECT id,title,status,shipper_email AS email,stripe_session_id AS sessionId FROM direct_listings WHERE id=? AND shipper_id=?').bind(id,userId).first<{id:number;title:string;status:string;email:string;sessionId:string|null}>();
    if(!listing)return NextResponse.json({error:'Listing not found.'},{status:404});
    if(listing.status!=='draft')return NextResponse.json({error:'This listing has already been published.'},{status:409});
    const stripe=stripeClient();
    if(listing.sessionId){const existing=await stripe.checkout.sessions.retrieve(listing.sessionId);if(existing.status==='open'&&existing.url)return NextResponse.json({url:existing.url});if(existing.payment_status==='paid')return NextResponse.json({error:'Payment received. Publication is being confirmed; refresh your listings shortly.'},{status:409});}
    const session=await stripe.checkout.sessions.create({mode:'payment',customer_email:listing.email,
      line_items:[{price_data:{currency:'usd',unit_amount:feeCents(),product_data:{name:'AVL load listing',description:'One listing on the AVL load board; driver delivery pay is arranged directly.'}},quantity:1}],
      metadata:{kind:'direct_listing',listing_id:String(id),shipper_id:userId},
      success_url:`${process.env.AVL_PUBLIC_URL}/my-loads?checkout=return`,cancel_url:`${process.env.AVL_PUBLIC_URL}/my-loads?checkout=cancel`,
    },{idempotencyKey:`listing-${id}-${listing.sessionId||'first'}`});
    await db().prepare("UPDATE direct_listings SET stripe_session_id=? WHERE id=? AND shipper_id=? AND status='draft'").bind(session.id,id,userId).run();
    return NextResponse.json({url:session.url});
  }catch(error){console.error('Listing checkout failed',error);return NextResponse.json({error:'Checkout could not be started.'},{status:503})}
}

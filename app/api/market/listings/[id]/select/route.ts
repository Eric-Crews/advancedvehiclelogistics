import { auth } from '@/lib/local-auth';
import { NextResponse } from 'next/server';
import { db } from '@/lib/desk-db';
export const dynamic = 'force-dynamic';
export async function POST(req: Request, { params }: {params:Promise<{id:string}>}) {
  const { userId } = await auth(); if (!userId) return NextResponse.json({error:'Sign in first.'},{status:401});
  const payload=await req.json().catch(()=>({})) as {offerId?:unknown};
  const id=Number((await params).id), offerId=Number(payload.offerId);
  if(!Number.isSafeInteger(id)||!Number.isSafeInteger(offerId)||id<1||offerId<1)return NextResponse.json({error:'Invalid selection.'},{status:400});
  try {
    const result=await db().prepare("UPDATE direct_listings SET status='selected',selected_offer_id=? WHERE id=? AND shipper_id=? AND status='open' AND EXISTS (SELECT 1 FROM direct_offers WHERE id=? AND listing_id=?)").bind(offerId,id,userId,offerId,id).run();
    if(!result.meta.changes)return NextResponse.json({error:'This listing is unavailable or the offer has changed.'},{status:409});
    await db().prepare("UPDATE direct_offers SET status=CASE WHEN id=? THEN 'selected' ELSE 'not_selected' END WHERE listing_id=?").bind(offerId,id).run();
    return NextResponse.json({status:'selected'});
  } catch(error){console.error('Select offer failed',error);return NextResponse.json({error:'Could not select this offer.'},{status:503})}
}

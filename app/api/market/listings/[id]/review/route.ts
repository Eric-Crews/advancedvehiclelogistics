import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/desk-db';
import { safeProfileText } from '@/lib/market';
export const dynamic='force-dynamic';
const schema=z.object({rating:z.number().int().min(1).max(5),comment:safeProfileText(700).refine(value=>value.length>=20,'Write at least 20 characters.'),deliveryCompleted:z.literal(true)});
export async function POST(req:Request,{params}:{params:Promise<{id:string}>}){
 const {userId}=await auth();if(!userId)return NextResponse.json({error:'Sign in first.'},{status:401});
 const id=Number((await params).id),parsed=schema.safeParse(await req.json().catch(()=>null));
 if(!Number.isSafeInteger(id)||id<1||!parsed.success)return NextResponse.json({error:'Confirm the delivery and enter a rating and at least 20 characters.'},{status:400});
 try{
  const selected=await db().prepare("SELECT o.driver_id AS driverId FROM direct_listings l JOIN direct_offers o ON o.id=l.selected_offer_id AND o.listing_id=l.id WHERE l.id=? AND l.shipper_id=? AND l.status='selected'").bind(id,userId).first<{driverId:string}>();
  if(!selected)return NextResponse.json({error:'Only the shipper who selected this driver can review this listing.'},{status:403});
  const result=await db().prepare('INSERT OR IGNORE INTO direct_reviews (listing_id,driver_id,shipper_id,rating,comment,created_at) VALUES (?,?,?,?,?,?)').bind(id,selected.driverId,userId,parsed.data.rating,parsed.data.comment,new Date().toISOString()).run();
  if(!result.meta.changes)return NextResponse.json({error:'You have already reviewed this listing.'},{status:409});
  return NextResponse.json({saved:true},{status:201});
 }catch(error){console.error('Review create failed',error);return NextResponse.json({error:'Could not save review.'},{status:503})}
}

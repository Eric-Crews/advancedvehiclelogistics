import { auth } from '@/lib/local-auth';
import { env } from 'cloudflare:workers';
import { NextResponse } from 'next/server';
import { db } from '@/lib/desk-db';
export const dynamic='force-dynamic';
const kindOf=(value:string|null)=>value==='vehicle'||value==='profile'?value:null;
const column=(kind:'vehicle'|'profile')=>kind==='vehicle'?'vehicle_photo_key':'profile_photo_key';
export async function POST(req:Request){
 const {userId}=await auth();if(!userId)return NextResponse.json({error:'Sign in to upload a photo.'},{status:401});
 const kind=kindOf(new URL(req.url).searchParams.get('kind'));if(!kind)return NextResponse.json({error:'Choose a photo type.'},{status:400});
 if(!env.BUCKET)return NextResponse.json({error:'Photo storage is unavailable.'},{status:503});
 if(req.headers.get('content-type')!=='image/webp')return NextResponse.json({error:'Upload a WebP image.'},{status:415});
 if(Number(req.headers.get('content-length')||0)>2_000_000)return NextResponse.json({error:'Photo exceeds 2 MB.'},{status:413});
 const bytes=new Uint8Array(await req.arrayBuffer());
 if(bytes.length<20||bytes.length>2_000_000||String.fromCharCode(...bytes.slice(0,4))!=='RIFF'||String.fromCharCode(...bytes.slice(8,12))!=='WEBP')return NextResponse.json({error:'Invalid photo. Try another image.'},{status:400});
 try{
  const old=await db().prepare(`SELECT ${column(kind)} AS photoKey FROM drivers WHERE clerk_user_id=?`).bind(userId).first<{photoKey:string|null}>();
  if(!old)return NextResponse.json({error:'Save your driver profile first.'},{status:409});
  const key=`drivers/${userId}/${kind}/${crypto.randomUUID()}.webp`;
  await env.BUCKET.put(key,bytes,{httpMetadata:{contentType:'image/webp'}});
  const update=await db().prepare(`UPDATE drivers SET ${column(kind)}=?,updated_at=? WHERE clerk_user_id=?`).bind(key,new Date().toISOString(),userId).run();
  if(!update.meta.changes){await env.BUCKET.delete(key);return NextResponse.json({error:'Profile not found.'},{status:404})}
  if(old.photoKey)await env.BUCKET.delete(old.photoKey).catch(()=>{});
  return NextResponse.json({photo:true});
 }catch(error){console.error('Photo upload failed',error);return NextResponse.json({error:'Could not save photo.'},{status:503})}
}
export async function GET(req:Request){
 const {userId}=await auth();if(!userId)return NextResponse.json({error:'Sign in to see photos.'},{status:401});
 const url=new URL(req.url),kind=kindOf(url.searchParams.get('kind'));if(!kind)return NextResponse.json({error:'Invalid photo.'},{status:400});
 if(!env.BUCKET)return NextResponse.json({error:'Photo storage unavailable.'},{status:503});
 const listingId=Number(url.searchParams.get('listingId')),offerId=Number(url.searchParams.get('offerId'));
 let driverId=userId;
 try{
  if(url.searchParams.has('listingId')||url.searchParams.has('offerId')){
   if(!Number.isSafeInteger(listingId)||!Number.isSafeInteger(offerId)||listingId<1||offerId<1)return NextResponse.json({error:'Invalid photo request.'},{status:400});
   const offer=await db().prepare("SELECT o.driver_id AS driverId FROM direct_offers o JOIN direct_listings l ON l.id=o.listing_id WHERE o.id=? AND l.id=? AND l.shipper_id=? AND l.status IN ('open','selected')").bind(offerId,listingId,userId).first<{driverId:string}>();
   if(!offer)return NextResponse.json({error:'Photo unavailable.'},{status:404});
   driverId=offer.driverId;
  }
  const row=await db().prepare(`SELECT ${column(kind)} AS photoKey FROM drivers WHERE clerk_user_id=?`).bind(driverId).first<{photoKey:string|null}>();
  if(!row?.photoKey)return NextResponse.json({error:'No photo uploaded.'},{status:404});
  const object=await env.BUCKET.get(row.photoKey);if(!object)return NextResponse.json({error:'Photo unavailable.'},{status:404});
  return new Response(object.body,{headers:{'Content-Type':'image/webp','Cache-Control':'private, max-age=300','X-Content-Type-Options':'nosniff'}});
 }catch(error){console.error('Photo fetch failed',error);return NextResponse.json({error:'Photo unavailable.'},{status:503})}
}

import { env } from 'cloudflare:workers';
import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { queueEmail, notifySafely, siteUrl } from '@/lib/notifications';
import { db } from '@/lib/desk-db';
import { paymentsConfigured } from '@/lib/stripe';
import { estimateForRequest } from '@/lib/estimate-store';
import { IntakeError } from '@/lib/estimate-http';
import type { EstimateDraft } from '@/lib/job-estimate';
export const dynamic = 'force-dynamic';
export const requestSchema = z.object({
  estimateId:z.string().uuid().optional(),
  category:z.enum(['furniture','marketplace','lumber','landscaping','appliance','other']),
  title:z.string().trim().min(3).max(140), description:z.string().trim().min(10).max(3000),
  origin:z.string().trim().min(3).max(200), destination:z.string().trim().min(3).max(200),
  pickupDate:z.string().min(4).max(40), pickupType:z.enum(['store','person','home','other']),
  carryHelp:z.enum(['curbside','one_person','two_people','unsure']),
  contactName:z.string().trim().min(2).max(100), contactEmail:z.string().trim().email().max(200),
  contactPhone:z.string().trim().max(35).optional().default(''), contactPreference:z.enum(['email','phone']),
  listingUrl:z.union([z.literal(''),z.string().url().max(1000)]).optional().default(''),
  lengthFt:z.number().positive().max(100).nullable().optional().default(null),
  weightLbs:z.number().int().positive().max(200000).nullable().optional().default(null),
});
export async function GET(){
  const {userId}=await auth();if(!userId)return NextResponse.json({error:'Sign in to see your requests.'},{status:401});
  try{const result=await env.DB!.prepare("SELECT l.id,l.title,l.category,l.description,l.origin,l.destination,l.pickup_date AS pickupDate,l.status,l.quote_cents AS quoteCents,l.quote_note AS quoteNote,l.created_at AS createdAt,l.booking_status AS bookingStatus,l.booking_note AS bookingNote,q.id AS quoteId,q.price_cents AS priceCents,q.scope,q.timing,q.expires_at AS expiresAt,q.status AS paymentStatus,q.paid_at AS paidAt FROM loads l LEFT JOIN delivery_quotes q ON q.id=l.current_quote_id WHERE l.customer_clerk_id=? ORDER BY l.id DESC LIMIT 60").bind(userId).all();return NextResponse.json({loads:result.results,paymentsEnabled:paymentsConfigured()});}
  catch(e){console.error('Customer loads fetch failed',e);return NextResponse.json({error:'Your requests are temporarily unavailable.'},{status:503})}
}
export async function POST(req:Request){
  const {userId}=await auth();if(!userId)return NextResponse.json({error:'Please sign in to send your request.'},{status:401});
  const parsed=requestSchema.safeParse(await req.json().catch(()=>null));
  if(!parsed.success)return NextResponse.json({error:'Please check the highlighted details and try again.',issues:parsed.error.flatten().fieldErrors},{status:400});
  const d=parsed.data;if((d.estimateId||d.contactPreference==='phone')&&!d.contactPhone)return NextResponse.json({error:'Add a phone number if you prefer a call.'},{status:400});
  try{
  const stored=d.estimateId?await estimateForRequest(req,d.estimateId,{title:d.title,category:d.category,description:d.description,origin:d.origin,destination:d.destination,carryHelp:d.carryHelp} as Omit<EstimateDraft,'roadMiles'>):null;
  if(stored?.load_id)return NextResponse.json({id:stored.load_id,status:'broker_review',alreadySubmitted:true});
  const insert=db().prepare('INSERT INTO loads (title,category,description,origin,destination,pickup_date,pickup_type,carry_help,length_ft,weight_lbs,equipment,loading,unloading,contact_name,contact_email,contact_phone,contact_preference,listing_url,status,created_at,customer_clerk_id,estimate_id) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)').bind(d.title,d.category,d.description,d.origin,d.destination,d.pickupDate,d.pickupType,d.carryHelp,d.lengthFt,d.weightLbs,'To be determined',d.carryHelp,d.carryHelp,d.contactName,d.contactEmail,d.contactPhone||null,d.contactPreference,d.listingUrl||null,'broker_review',new Date().toISOString(),userId,d.estimateId||null);
  const results=await db().batch([insert,...(d.estimateId?[db().prepare('UPDATE job_estimates SET load_id=(SELECT id FROM loads WHERE estimate_id=?) WHERE id=? AND load_id IS NULL').bind(d.estimateId,d.estimateId)]:[])]);
  const requestId=Number(results[0].meta.last_row_id);const notificationId=`request:${requestId}`;
  try{await db().batch([queueEmail(notificationId,requestId,process.env.AVL_ADMIN_EMAIL||'',`New AVL delivery request #${requestId}: ${d.title}`,`${d.contactName} requested a delivery.\n${d.origin} → ${d.destination}\n\n${d.description}\n\nReview: ${siteUrl()}/desk?request=${requestId}`)]);await notifySafely(notificationId)}catch{console.error('Request notification could not be queued')}
  return NextResponse.json({id:requestId,status:'broker_review'},{status:201})}
  catch(e){if(e instanceof IntakeError)return NextResponse.json({error:e.message},{status:e.status});console.error('Request submission failed',e instanceof Error?e.name:'error');return NextResponse.json({error:'We could not save your request. Please try again.'},{status:503})}
}

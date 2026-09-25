import { env } from 'cloudflare:workers';
import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
export const dynamic='force-dynamic';
const schema=z.object({loadId:z.number().int().positive(),carrierName:z.string().trim().min(2).max(150),contactEmail:z.string().email().max(200),mcNumber:z.string().trim().min(3).max(30),equipment:z.string().trim().min(3).max(100),amount:z.number().positive().max(1000000),note:z.string().max(1000).optional()});
export async function POST(req:NextRequest){
  const {userId}=await auth();if(!userId)return NextResponse.json({error:'Sign in to offer a rate.'},{status:401});
  let body;try{body=schema.safeParse(await req.json())}catch{return NextResponse.json({error:'Invalid request.'},{status:400})}
  if(!body.success)return NextResponse.json({error:'Check your carrier and rate details.'},{status:400});
  const d=body.data;try{const driver=await env.DB!.prepare('SELECT mc_number AS mcNumber,business_name AS businessName,contact_email AS contactEmail FROM drivers WHERE clerk_user_id=?').bind(userId).first<{mcNumber:string;businessName:string;contactEmail:string}>();if(!driver)return NextResponse.json({error:'Register as a driver before offering a rate.'},{status:403});if(driver.mcNumber!==d.mcNumber||driver.businessName!==d.carrierName||driver.contactEmail!==d.contactEmail)return NextResponse.json({error:'Carrier details must match your driver registration.'},{status:400});const load=await env.DB!.prepare('SELECT status FROM loads WHERE id = ?').bind(d.loadId).first<{status:string}>();if(!load)return NextResponse.json({error:'Load no longer available.'},{status:404});if(load.status!=='open')return NextResponse.json({error:'This load is awaiting broker review.'},{status:409});await env.DB!.prepare('INSERT INTO bids (load_id,carrier_name,contact_email,mc_number,equipment,amount,note,status,created_at,driver_clerk_id) VALUES (?,?,?,?,?,?,?,?,?,?)').bind(d.loadId,d.carrierName,d.contactEmail,d.mcNumber,d.equipment,d.amount,d.note??null,'pending_verification',new Date().toISOString(),userId).run();return NextResponse.json({status:'pending_verification'},{status:201})}catch(e){console.error('Bid submission failed',e);return NextResponse.json({error:'Could not save your rate. Please retry.'},{status:503})}
}

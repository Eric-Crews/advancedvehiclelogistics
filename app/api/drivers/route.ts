import { auth } from '@/lib/local-auth';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/desk-db';
import { safeProfileText } from '@/lib/market';
export const dynamic = 'force-dynamic';
const schema = z.object({
  businessName:z.string().trim().min(2).max(150),contactEmail:z.string().trim().email().max(200),
  mcNumber:z.string().trim().max(30),dotNumber:z.string().trim().max(30),equipment:z.string().trim().min(3).max(200),
  about:safeProfileText(700),serviceArea:safeProfileText(160),vehicleDetails:safeProfileText(250),
  businessType:z.enum(['sole_proprietor','llc','corporation','other']),insuranceDescription:safeProfileText(250),
});
export async function GET(){
 const {userId}=await auth();if(!userId)return NextResponse.json({error:'Sign in to view your driver profile.'},{status:401});
 try{const driver=await db().prepare('SELECT business_name AS businessName,contact_email AS contactEmail,mc_number AS mcNumber,dot_number AS dotNumber,equipment,about,service_area AS serviceArea,vehicle_details AS vehicleDetails,business_type AS businessType,insurance_description AS insuranceDescription,vehicle_photo_key AS vehiclePhotoKey,profile_photo_key AS profilePhotoKey,status FROM drivers WHERE clerk_user_id=?').bind(userId).first();return NextResponse.json({driver})}
 catch(error){console.error('Driver fetch failed',error);return NextResponse.json({error:'Driver profile unavailable.'},{status:503})}
}
export async function POST(req:Request){
 const {userId}=await auth();if(!userId)return NextResponse.json({error:'Sign in to create your driver profile.'},{status:401});
 const parsed=schema.safeParse(await req.json().catch(()=>null));if(!parsed.success)return NextResponse.json({error:'Check your business and vehicle details.',issues:parsed.error.flatten().fieldErrors},{status:400});
 const d=parsed.data,now=new Date().toISOString();
 try{await db().prepare("INSERT INTO drivers (clerk_user_id,business_name,contact_email,mc_number,dot_number,equipment,about,service_area,vehicle_details,business_type,insurance_description,status,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,'pending_verification',?,?) ON CONFLICT(clerk_user_id) DO UPDATE SET business_name=excluded.business_name,contact_email=excluded.contact_email,mc_number=excluded.mc_number,dot_number=excluded.dot_number,equipment=excluded.equipment,about=excluded.about,service_area=excluded.service_area,vehicle_details=excluded.vehicle_details,business_type=excluded.business_type,insurance_description=excluded.insurance_description,status='pending_verification',updated_at=excluded.updated_at")
 .bind(userId,d.businessName,d.contactEmail,d.mcNumber,d.dotNumber,d.equipment,d.about,d.serviceArea,d.vehicleDetails,d.businessType,d.insuranceDescription,now,now).run();return NextResponse.json({status:'saved'})}
 catch(error){console.error('Driver save failed',error);return NextResponse.json({error:'Could not save your profile.'},{status:503})}
}

import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/desk-db';
export const dynamic = 'force-dynamic';
const schema = z.object({ amountDollars: z.number().min(25).max(100000), note: z.string().trim().min(5).max(500) });
type Ctx = { params: Promise<{ id: string }> };
export async function POST(req: Request, { params }: Ctx) {
  const { userId } = await auth(); if (!userId) return NextResponse.json({ error: 'Sign in to offer a rate.' }, { status: 401 });
  const id = Number((await params).id); if (!Number.isSafeInteger(id) || id < 1) return NextResponse.json({ error: 'Invalid listing.' }, { status: 400 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Enter a valid rate and a short note.' }, { status: 400 });
  try {
    const driver = await db().prepare('SELECT business_name AS name,contact_email AS email,status,vehicle_photo_key AS vehiclePhotoKey FROM drivers WHERE clerk_user_id=?').bind(userId).first<{name:string;email:string;status:string;vehiclePhotoKey:string|null}>();
    if (!driver) return NextResponse.json({ error: 'Create a driver profile first.' }, { status: 403 });
    if (!driver.vehiclePhotoKey) return NextResponse.json({ error: 'Add a vehicle photo to your driver profile before offering.' }, { status: 409 });
    const listing = await db().prepare('SELECT shipper_id AS shipperId,status FROM direct_listings WHERE id=?').bind(id).first<{shipperId:string;status:string}>();
    if (!listing || listing.status !== 'open') return NextResponse.json({ error: 'This listing is no longer open.' }, { status: 409 });
    if (listing.shipperId === userId) return NextResponse.json({ error: 'You cannot offer on your own listing.' }, { status: 403 });
    await db().prepare("INSERT INTO direct_offers (listing_id,driver_id,driver_name,driver_email,amount_cents,note,status,created_at) VALUES (?,?,?,?,?,?,'pending',?) ON CONFLICT(listing_id,driver_id) DO UPDATE SET amount_cents=excluded.amount_cents,note=excluded.note,created_at=excluded.created_at")
      .bind(id,userId,driver.name,driver.email,Math.round(parsed.data.amountDollars*100),parsed.data.note,new Date().toISOString()).run();
    return NextResponse.json({ status: 'pending' }, { status: 201 });
  } catch (error) { console.error('Offer failed', error); return NextResponse.json({ error: 'Could not save your offer.' }, { status: 503 }); }
}
export async function GET(_req: Request, { params }: Ctx) {
  const { userId } = await auth(); if (!userId) return NextResponse.json({ error: 'Sign in first.' }, { status: 401 });
  const id = Number((await params).id); if (!Number.isSafeInteger(id) || id < 1) return NextResponse.json({ error: 'Invalid listing.' }, { status: 400 });
  try {
    const listing = await db().prepare('SELECT shipper_id AS shipperId,status,selected_offer_id AS selectedOfferId,shipper_name AS shipperName,shipper_email AS shipperEmail,shipper_phone AS shipperPhone FROM direct_listings WHERE id=?').bind(id).first<{shipperId:string;status:string;selectedOfferId:number|null;shipperName:string;shipperEmail:string;shipperPhone:string|null}>();
    if (!listing) return NextResponse.json({ error: 'Listing not found.' }, { status: 404 });
    const isShipper = listing.shipperId === userId;
    const rows = await db().prepare(`SELECT o.id,o.driver_id AS driverId,o.driver_name AS driverName,o.driver_email AS driverEmail,o.amount_cents AS amountCents,o.note,o.status,o.created_at AS createdAt,
      d.about,d.service_area AS serviceArea,d.vehicle_details AS vehicleDetails,d.equipment,d.business_type AS businessType,d.insurance_description AS insuranceDescription,d.mc_number AS mcNumber,d.dot_number AS dotNumber,d.vehicle_photo_key AS vehiclePhotoKey,d.profile_photo_key AS profilePhotoKey,
      (SELECT COUNT(*) FROM direct_reviews r WHERE r.driver_id=o.driver_id) AS reviewCount,
      (SELECT ROUND(AVG(r.rating),1) FROM direct_reviews r WHERE r.driver_id=o.driver_id) AS reviewAverage
      FROM direct_offers o LEFT JOIN drivers d ON d.clerk_user_id=o.driver_id WHERE o.listing_id=? AND (o.driver_id=? OR ?=1) ORDER BY o.created_at DESC`).bind(id,userId,isShipper?1:0).all();
    const offers=await Promise.all(rows.results.map(async row=>{
      const selected=listing.selectedOfferId===row.id;
      const reviews=isShipper?await db().prepare('SELECT rating,comment,created_at AS createdAt FROM direct_reviews WHERE driver_id=? ORDER BY id DESC LIMIT 3').bind(row.driverId).all():null;
      return {id:row.id,driverName:selected?row.driverName:`Driver #${row.id}`,driverEmail:isShipper&&selected?row.driverEmail:null,
        amountCents:row.amountCents,note:row.note,status:row.status,createdAt:row.createdAt,
        profile:isShipper?{about:row.about,serviceArea:row.serviceArea,vehicleDetails:row.vehicleDetails,equipment:row.equipment,businessType:row.businessType,
          insuranceDescription:row.insuranceDescription,hasMc:Boolean(row.mcNumber),hasDot:Boolean(row.dotNumber),
          vehiclePhotoUrl:row.vehiclePhotoKey?`/api/drivers/photos?kind=vehicle&listingId=${id}&offerId=${row.id}`:null,
          profilePhotoUrl:row.profilePhotoKey?`/api/drivers/photos?kind=profile&listingId=${id}&offerId=${row.id}`:null,
          reviewCount:row.reviewCount,reviewAverage:row.reviewAverage,reviews:reviews?.results||[]}:null,
        shipperContact:!isShipper&&selected?{name:listing.shipperName,email:listing.shipperEmail,phone:listing.shipperPhone}:null};
    }));
    return NextResponse.json({ offers, selectedOfferId: listing.selectedOfferId });
  } catch (error) { console.error('Offers fetch failed', error); return NextResponse.json({ error: 'Offers unavailable.' }, { status: 503 }); }
}

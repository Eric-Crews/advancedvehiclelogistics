import { auth } from '@/lib/local-auth';
import { NextResponse } from 'next/server';
import { db } from '@/lib/desk-db';
import { feeCents, listingSchema, publicListing } from '@/lib/market';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Sign in to create a listing.' }, { status: 401 });
  const parsed = listingSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Check the listing details.', issues: parsed.error.flatten().fieldErrors }, { status: 400 });
  const d = parsed.data;
  try {
    const result = await db().prepare('INSERT INTO direct_listings (shipper_id,title,description,origin,destination,pickup_date,equipment,weight_lbs,length_ft,handling,offered_cents,shipper_name,shipper_email,shipper_phone,status,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)')
      .bind(userId,d.title,d.description,d.origin,d.destination,d.pickupDate,d.equipment,d.weightLbs,d.lengthFt,d.handling,Math.round(d.offeredDollars * 100),d.shipperName,d.shipperEmail,d.shipperPhone || null,'review_pending',new Date().toISOString()).run();
    return NextResponse.json({ id: Number(result.meta.last_row_id), status: 'review_pending', feeCents: feeCents() }, { status: 201 });
  } catch (error) { console.error('Listing create failed', error); return NextResponse.json({ error: 'Listing could not be saved.' }, { status: 503 }); }
}
export async function GET(req: Request) {
  const mine = new URL(req.url).searchParams.get('mine') === '1';
  const { userId } = await auth();
  try {
    if (mine) {
      if (!userId) return NextResponse.json({ error: 'Sign in to see your listings.' }, { status: 401 });
      const result = await db().prepare('SELECT id,title,description,origin,destination,pickup_date AS pickupDate,equipment,handling,weight_lbs AS weightLbs,length_ft AS lengthFt,offered_cents AS offeredCents,status,review_note AS reviewNote,selected_offer_id AS selectedOfferId,created_at AS createdAt, EXISTS(SELECT 1 FROM direct_reviews r WHERE r.listing_id=direct_listings.id) AS hasReview FROM direct_listings WHERE shipper_id=? ORDER BY id DESC LIMIT 100').bind(userId).all();
      return NextResponse.json({ listings: result.results, feeCents: feeCents(), checkoutAvailable: false });
    }
    const result = await db().prepare("SELECT id,title,description,origin,destination,pickup_date AS pickupDate,equipment,handling,weight_lbs AS weightLbs,length_ft AS lengthFt,offered_cents AS offeredCents,status,created_at AS createdAt FROM direct_listings WHERE status='open' ORDER BY id DESC LIMIT 100").all();
    return NextResponse.json({ listings: result.results.map(row => publicListing(row as Record<string, unknown>)) });
  } catch (error) { console.error('Listings fetch failed', error); return NextResponse.json({ error: 'Listings are temporarily unavailable.' }, { status: 503 }); }
}

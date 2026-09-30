import { NextResponse } from 'next/server';
export { POST } from '../loads/route';
export const dynamic='force-dynamic';
export async function GET(){return NextResponse.json({name:'AVL direct load listing',version:2,description:'Signed-in shippers submit a test listing for AVL review. An owner approves it before drivers see it. Drivers make offers; the shipper selects and contracts directly.',authentication:'AVL account session',create:'POST /api/market/listings',list:'GET /api/market/listings',myListings:'GET /api/market/listings?mine=1',offers:'POST /api/market/listings/{id}/offers',note:'The legacy quote intake is disabled.'})}

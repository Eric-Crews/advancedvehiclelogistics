import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { isOperator } from '@/lib/operator';
export const dynamic='force-dynamic';
export async function GET(){const {userId}=await auth();return NextResponse.json({signedIn:Boolean(userId),admin:await isOperator()})}

import { headers } from 'next/headers';
import { auth, currentUser } from '@clerk/nextjs/server';

export async function isOperator(){
  // Only Sites' authenticated dispatcher identity can use this explicit owner fallback.
  // Leave disabled when deploying outside Sites.
  if(process.env.AVL_ALLOW_SITE_OWNER_AUTH==='true'){
    const h=await headers();
    const email=h.get('oai-authenticated-user-email')?.trim().toLowerCase();
    if(h.get('oai-authenticated-user-id')&&email&&email===process.env.AVL_ADMIN_EMAIL?.trim().toLowerCase())return true;
  }
  const {userId}=await auth();
  if(!userId)return false;
  if(process.env.AVL_ADMIN_CLERK_USER_ID===userId)return true;
  const ownerEmail=process.env.AVL_ADMIN_EMAIL?.trim().toLowerCase();
  if(!ownerEmail)return false;
  try {
    const user=await currentUser();
    const email=user?.primaryEmailAddress;
    return Boolean(email&&email.verification?.status==='verified'&&email.emailAddress.toLowerCase()===ownerEmail);
  } catch { return false; }
}

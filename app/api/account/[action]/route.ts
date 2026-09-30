import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/desk-db';
import { createSession, currentAccount, endSession, passwordHash, random, safeOrigin } from '@/lib/local-auth';
export const dynamic='force-dynamic';
const schema=z.object({email:z.string().trim().email().max(200),password:z.string().min(12).max(128)});
const deny=()=>NextResponse.json({error:'Email or password is incorrect.'},{status:401});
export async function GET(){const account=await currentAccount();return NextResponse.json({signedIn:Boolean(account),email:account?.email||null},{headers:{'Cache-Control':'no-store'}})}
export async function POST(req:Request,{params}:{params:Promise<{action:string}>}){
 if(!safeOrigin(req))return NextResponse.json({error:'Invalid request origin.'},{status:403});
 const {action}=await params;
 if(action==='signout'){await endSession();return NextResponse.json({ok:true})}
 if(action!=='signup'&&action!=='signin')return NextResponse.json({error:'Not found.'},{status:404});
 const parsed=schema.safeParse(await req.json().catch(()=>null));if(!parsed.success)return NextResponse.json({error:'Enter a valid email and a password of at least 12 characters.'},{status:400});
 const email=parsed.data.email.toLowerCase(),password=parsed.data.password;
 try{
  if(action==='signup'){
   const salt=random(),id=crypto.randomUUID(),hash=await passwordHash(password,salt);
   await db().prepare('INSERT INTO local_users (id,email,password_hash,salt,created_at) VALUES (?,?,?,?,?)').bind(id,email,hash,salt,new Date().toISOString()).run();
   await createSession(id);return NextResponse.json({ok:true,email},{status:201});
  }
  const user=await db().prepare('SELECT id,password_hash AS hash,salt,failed_attempts AS attempts,locked_until AS lockedUntil FROM local_users WHERE email=?').bind(email).first<{id:string;hash:string;salt:string;attempts:number;lockedUntil:string|null}>();
  if(!user)return deny();
  if(user.lockedUntil&&user.lockedUntil>new Date().toISOString())return NextResponse.json({error:'Too many attempts. Try again in 15 minutes.'},{status:429});
  const hash=await passwordHash(password,user.salt);
  if(hash!==user.hash){const attempts=user.attempts+1;await db().prepare('UPDATE local_users SET failed_attempts=?,locked_until=? WHERE id=?').bind(attempts,attempts>=5?new Date(Date.now()+15*60000).toISOString():null,user.id).run();return deny()}
  await db().prepare('UPDATE local_users SET failed_attempts=0,locked_until=NULL WHERE id=?').bind(user.id).run();await createSession(user.id);return NextResponse.json({ok:true,email});
 }catch(error){console.error('Account action failed',error);return NextResponse.json({error:action==='signup'?'Account could not be created. This email may already be registered.':'Sign in is temporarily unavailable.'},{status:503})}
}

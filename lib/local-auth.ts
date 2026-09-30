import { cookies } from 'next/headers';
import { db } from '@/lib/desk-db';

const cookieName='avl_session';
const encoder=new TextEncoder();
const hex=(bytes:Uint8Array)=>Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');
const random=()=>hex(crypto.getRandomValues(new Uint8Array(32)));
const sha=async(value:string)=>hex(new Uint8Array(await crypto.subtle.digest('SHA-256',encoder.encode(value))));
export async function passwordHash(password:string,salt:string){const key=await crypto.subtle.importKey('raw',encoder.encode(password),'PBKDF2',false,['deriveBits']);return hex(new Uint8Array(await crypto.subtle.deriveBits({name:'PBKDF2',salt:encoder.encode(salt),iterations:310000,hash:'SHA-256'},key,256)))}
export function safeOrigin(req:Request){const origin=req.headers.get('origin');return Boolean(origin&&origin===new URL(req.url).origin)}
export async function createSession(userId:string){const token=random(),now=new Date(),expires=new Date(now.getTime()+14*86400000);await db().prepare('INSERT INTO local_sessions (token_hash,user_id,expires_at,created_at) VALUES (?,?,?,?)').bind(await sha(token),userId,expires.toISOString(),now.toISOString()).run();(await cookies()).set(cookieName,token,{httpOnly:true,secure:true,sameSite:'lax',path:'/',expires});}
export async function endSession(){const jar=await cookies(),token=jar.get(cookieName)?.value;if(token)await db().prepare('DELETE FROM local_sessions WHERE token_hash=?').bind(await sha(token)).run();jar.delete(cookieName)}
export async function currentAccount(){const token=(await cookies()).get(cookieName)?.value;if(!token||!/^[a-f0-9]{64}$/.test(token))return null;return await db().prepare('SELECT u.id,u.email FROM local_sessions s JOIN local_users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires_at>?').bind(await sha(token),new Date().toISOString()).first<{id:string;email:string}>()}
export async function auth(){const account=await currentAccount();return {userId:account?.id||null}}
export async function currentUser(){const account=await currentAccount();return account?{primaryEmailAddress:{emailAddress:account.email,verification:{status:'unverified'}}}:null}
export {random};

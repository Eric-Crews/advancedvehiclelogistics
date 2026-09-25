import { db, now } from './desk-db';
export function emailConfigured(){return Boolean(process.env.CLICKSEND_USERNAME&&process.env.CLICKSEND_API_KEY&&Number(process.env.CLICKSEND_FROM_EMAIL_ID)>0)}
export function siteUrl(){return (process.env.AVL_PUBLIC_URL||'https://advanced-vehicle-logistics.advguides.chatgpt.site').replace(/\/$/,'')}
export function queueEmail(id:string,loadId:number,recipient:string,subject:string,body:string){
 return db().prepare('INSERT OR IGNORE INTO notifications (id,load_id,recipient,subject,body,status,created_at) VALUES (?,?,?,?,?,?,?)').bind(id,loadId,recipient,subject,body,emailConfigured()?'pending':'unconfigured',now());
}
const escape=(s:string)=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
export async function deliverEmail(id:string){
 if(!emailConfigured())return 'unconfigured';
 const claimed=await db().prepare("UPDATE notifications SET status='sending',error=NULL WHERE id=? AND status IN ('pending','failed','unconfigured') RETURNING recipient,subject,body").bind(id).first<{recipient:string;subject:string;body:string}>();
 if(!claimed)return 'unchanged';
 try{
  if(!claimed.recipient)throw new Error('No recipient configured');
  const response=await fetch('https://rest.clicksend.com/v3/email/send',{method:'POST',signal:AbortSignal.timeout(10000),headers:{Authorization:`Basic ${btoa(`${process.env.CLICKSEND_USERNAME}:${process.env.CLICKSEND_API_KEY}`)}`,'Content-Type':'application/json'},body:JSON.stringify({to:[{email:claimed.recipient}],from:{email_address_id:Number(process.env.CLICKSEND_FROM_EMAIL_ID),name:'Advanced Vehicle Logistics'},subject:claimed.subject,body:`<div style="font:16px/1.6 Arial,sans-serif;white-space:pre-wrap">${escape(claimed.body)}</div>`})});
  const data=await response.json() as {response_code?:string};
  if(!response.ok||data.response_code!=='SUCCESS')throw new Error(`Email service rejected request (${response.status})`);
  await db().prepare("UPDATE notifications SET status='accepted',sent_at=?,error=NULL WHERE id=?").bind(now(),id).run();
  return 'accepted';
 }catch{
  // A timeout may occur after the provider accepted the message. Never retry automatically.
  await db().prepare("UPDATE notifications SET status='failed',error='Delivery could not be confirmed. Check ClickSend before retrying to avoid duplicates.' WHERE id=?").bind(id).run();
  return 'failed';
 }
}
export async function notifySafely(id:string){try{return await deliverEmail(id)}catch{return 'failed'}}

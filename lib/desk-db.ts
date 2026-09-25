import { env } from 'cloudflare:workers';
export function db(){if(!env.DB)throw new Error('Database unavailable');return env.DB}
export function audit(loadId:number,actor:string,message:string){return db().prepare('INSERT INTO desk_events (load_id,actor,message,created_at) VALUES (?,?,?,?)').bind(loadId,actor,message,new Date().toISOString())}
export const now=()=>new Date().toISOString();

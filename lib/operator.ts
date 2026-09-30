import { headers } from 'next/headers';
export async function isOperator(){
 const h=await headers();
 const owner=process.env.AVL_ADMIN_EMAIL?.trim().toLowerCase();
 return Boolean(owner&&h.get('oai-authenticated-user-id')&&h.get('oai-authenticated-user-email')?.trim().toLowerCase()===owner);
}

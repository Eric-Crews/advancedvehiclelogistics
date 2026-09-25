export function quoteMath(priceCents:number,costCents:number,extraCents:number,feeBps:number,fixedFeeCents:number){
 const feeCents=Math.round(priceCents*feeBps/10000)+fixedFeeCents;
 const profitCents=priceCents-costCents-extraCents-feeCents;
 return {feeCents,profitCents,marginPercent:priceCents>0?100*profitCents/priceCents:0};
}
export function targetPrice(costCents:number,extraCents:number,feeBps:number,fixedFeeCents:number,targetMargin:number){
 const denominator=1-feeBps/10000-targetMargin/100;
 if(denominator<=0)return null;
 return Math.ceil((costCents+extraCents+fixedFeeCents)/denominator);
}
export const money=(cents:number)=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(cents/100);
export const providers=['AVL delivery','Curri','Roadie','Warp','Other'] as const;

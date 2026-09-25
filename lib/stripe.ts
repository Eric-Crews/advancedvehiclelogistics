import Stripe from 'stripe';
export function paymentsConfigured(){return Boolean(process.env.AVL_PAYMENTS_ENABLED==='true'&&process.env.STRIPE_SECRET_KEY&&process.env.STRIPE_WEBHOOK_SECRET&&process.env.AVL_PUBLIC_URL?.startsWith('https://'))}
export function stripeClient(){
 if(!process.env.STRIPE_SECRET_KEY)throw new Error('Payments are not configured');
 return new Stripe(process.env.STRIPE_SECRET_KEY,{httpClient:Stripe.createFetchHttpClient(),maxNetworkRetries:1});
}

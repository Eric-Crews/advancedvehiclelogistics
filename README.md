# Advanced Vehicle Logistics

Advanced Vehicle Logistics is a customer-friendly delivery platform for everyday items and specialty loads. Customers submit one clear request, AVL reviews the available fulfillment paths, sends one quote, and coordinates the delivery from payment through completion.

The app includes:

- a guided customer quote-request flow
- typed/voice delivery assessment with OpenAI, crew/time pricing, and a $60 job minimum
- Clerk sign-in and account-based request tracking
- a private quote desk for comparing AVL, Curri, Roadie, Warp, and other options
- cost, margin, quote, payment, and booking-status workflows
- a driver registration and specialty load-board experience
- optional ClickSend email notifications
- Stripe Checkout and verified webhook handling, gated until payments are enabled

## Local development

Prerequisites:

- Node.js 22.13 or newer
- pnpm 11.25

Install and start the app:

```bash
pnpm install
pnpm dev
```

Run verification:

```bash
pnpm exec tsc --noEmit
pnpm build
```

## Configuration

Copy `.env.example` to `.env.local` and fill in only the services you are using. Never commit `.env.local` or live secrets.

Clerk is required for customer and driver accounts. The quote desk is restricted to the configured AVL operator. Stripe remains disabled unless `AVL_PAYMENTS_ENABLED=true` and all required Stripe settings are present.

AI estimates require the server secret `OPENAI_API_KEY`. Without it, customers can still submit for human review. Pricing assumptions, prompt/schema, activation, limits, and the phone-confirmation workflow are documented in [Delivery estimation](docs/delivery-estimation.md).

## Database

The app uses Cloudflare D1 with Drizzle migrations in `drizzle/`. Apply migrations in order before using a new environment.

Generate a migration after schema changes:

```bash
pnpm db:generate
```

## Hosting

The project includes its Sites configuration in `.openai/hosting.json`. The hosted Sites deployment and this GitHub repository can be maintained independently.

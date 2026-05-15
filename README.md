# DineIntel

Premium no-login restaurant growth audit MVP.

DineIntel helps restaurant owners quickly understand what may be hurting online visibility, customer conversion, reviews, social activity, and retention.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Framer Motion
- Vercel-ready API route structure

## Local Development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Production Checks

```bash
npm run lint
npm run build
```

## Environment Variables

Stripe checkout and the optional future AI integration use environment variables.

```bash
OPENAI_API_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
STRIPE_SECRET_KEY=
STRIPE_PRICE_DETAILED_REPORT=
STRIPE_PRICE_STARTER_MONITOR=
STRIPE_PRICE_PRO_MONITOR=
```

`OPENAI_API_KEY` is reserved for a future real AI audit integration. The current audit engine uses local simulated scoring.
`STRIPE_SECRET_KEY` stays server-side only. Use the Stripe test price IDs in the three `STRIPE_PRICE_*` variables for local checkout testing.

## Vercel Production Environment

Set these manually in Vercel for production:

```text
NEXT_PUBLIC_APP_URL=https://dineintel.app
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PRICE_DETAILED_REPORT=price_...
STRIPE_PRICE_STARTER_MONITOR=price_...
STRIPE_PRICE_PRO_MONITOR=price_...
```

Test vs live:

- Test: `sk_test_...` + test `price_...` IDs
- Live: `sk_live_...` + live `price_...` IDs
- Keep `NEXT_PUBLIC_APP_URL` set to the live domain in production

## Deploy

Recommended hosting: Vercel.

Build command:

```bash
npm run build
```

Output: Next.js default.

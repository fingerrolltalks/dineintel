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

Stripe checkout and OpenAI audit generation use environment variables.

```bash
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini
CRON_SECRET=
NEXT_PUBLIC_APP_URL=http://localhost:3000
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
DATABASE_URL=
STRIPE_PRICE_DETAILED_REPORT=
STRIPE_PRICE_STARTER_MONITOR=
STRIPE_PRICE_PRO_MONITOR=
STRIPE_PRICE_REPORT=
STRIPE_PRICE_STARTER=
STRIPE_PRICE_PRO=
```

`OPENAI_API_KEY` enables AI-generated growth snapshots and recommendations. The app falls back to the template audit if it is missing or OpenAI fails.
`OPENAI_MODEL` is optional; the default is `gpt-4o-mini`.
`CRON_SECRET` protects the recurring monitoring cron route in production.
`STRIPE_SECRET_KEY` stays server-side only. Use the Stripe test price IDs in the test `STRIPE_PRICE_*` variables for local checkout testing.
`STRIPE_WEBHOOK_SECRET` is needed for Stripe webhook verification in both local testing and production.
`DATABASE_URL` stores completed purchases server-side so unlocks can persist across refreshes and devices.

Live Stripe price IDs:

- `STRIPE_PRICE_REPORT=price_1TWo4BJ9YwzUC7JXLhDnDXYu`
- `STRIPE_PRICE_STARTER=price_1TWo50J9YwzUC7JXf75tNk9N`
- `STRIPE_PRICE_PRO=price_1TWo5vJ9YwzUC7JXtPNW0y6q`

## Vercel Production Environment

Set these manually in Vercel for production:

```text
NEXT_PUBLIC_APP_URL=https://dineintel.app
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
DATABASE_URL=postgresql://...
STRIPE_PRICE_REPORT=price_1TWo4BJ9YwzUC7JXLhDnDXYu
STRIPE_PRICE_STARTER=price_1TWo50J9YwzUC7JXf75tNk9N
STRIPE_PRICE_PRO=price_1TWo5vJ9YwzUC7JXtPNW0y6q
```

Test vs live:

- Test local env: `sk_test_...` + `STRIPE_PRICE_DETAILED_REPORT`, `STRIPE_PRICE_STARTER_MONITOR`, `STRIPE_PRICE_PRO_MONITOR`
- Live Vercel env: `sk_live_...` + `STRIPE_PRICE_REPORT`, `STRIPE_PRICE_STARTER`, `STRIPE_PRICE_PRO`
- Keep `NEXT_PUBLIC_APP_URL` set to the live domain in production
- Add `DATABASE_URL` in both local and production if you want unlock persistence across devices

## Deploy

Recommended hosting: Vercel.

Build command:

```bash
npm run build
```

Output: Next.js default.

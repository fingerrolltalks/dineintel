# DineLeak

Premium no-login restaurant growth audit MVP.

DineLeak helps restaurant owners quickly understand what may be hurting online visibility, customer conversion, reviews, social activity, and retention.

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
GOOGLE_PAGESPEED_API_KEY=
GOOGLE_PLACES_API_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
DATABASE_URL=
POSTGRES_URL=
STRIPE_PRICE_REPORT=
STRIPE_PRICE_STARTER=
STRIPE_PRICE_PRO=
```

`OPENAI_API_KEY` enables AI-generated growth snapshots and recommendations. The app falls back to the template audit if it is missing or OpenAI fails.
`OPENAI_MODEL` is optional; the default is `gpt-4o-mini`.
`CRON_SECRET` protects the recurring monitoring cron route in production.
`GOOGLE_PAGESPEED_API_KEY` and `GOOGLE_PLACES_API_KEY` are optional server-side enrichments. The audit still works without them.
`STRIPE_SECRET_KEY` stays server-side only. Use the Stripe test price IDs in `STRIPE_PRICE_REPORT`, `STRIPE_PRICE_STARTER`, and `STRIPE_PRICE_PRO` for local checkout testing.
`STRIPE_WEBHOOK_SECRET` is needed for Stripe webhook verification in both local testing and production.
`DATABASE_URL` is preferred, but `POSTGRES_URL` also works for Neon/Vercel Postgres. It stores completed purchases, audits, and recurring monitoring schedules.

Live Stripe price IDs:

- `STRIPE_PRICE_REPORT=price_1TWo4BJ9YwzUC7JXLhDnDXYu`
- `STRIPE_PRICE_STARTER=price_1TWo50J9YwzUC7JXf75tNk9N`
- `STRIPE_PRICE_PRO=price_1TWo5vJ9YwzUC7JXtPNW0y6q`

## Vercel Production Environment

Set these manually in Vercel for production:

```text
NEXT_PUBLIC_APP_URL=https://dineleak.app
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
DATABASE_URL=postgresql://...
POSTGRES_URL=postgresql://...
STRIPE_PRICE_REPORT=price_1TWo4BJ9YwzUC7JXLhDnDXYu
STRIPE_PRICE_STARTER=price_1TWo50J9YwzUC7JXf75tNk9N
STRIPE_PRICE_PRO=price_1TWo5vJ9YwzUC7JXtPNW0y6q
GOOGLE_PAGESPEED_API_KEY=
GOOGLE_PLACES_API_KEY=
```

Test vs live:

- Test local env: `sk_test_...` + `STRIPE_PRICE_REPORT`, `STRIPE_PRICE_STARTER`, `STRIPE_PRICE_PRO`
- Live Vercel env: `sk_live_...` + `STRIPE_PRICE_REPORT`, `STRIPE_PRICE_STARTER`, `STRIPE_PRICE_PRO`
- Keep `NEXT_PUBLIC_APP_URL` set to `https://dineleak.app` in production
- Add `DATABASE_URL` or `POSTGRES_URL` in Vercel before accepting paid customers. The app uses it for purchase unlocks, audit history, and recurring scans.

## Database

Use Vercel Marketplace Neon Postgres for production. Once `DATABASE_URL` or `POSTGRES_URL` is set, the app creates the required tables automatically.

Protected database check:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" https://dineleak.app/api/database/health
```

## Deploy

Recommended hosting: Vercel.

Build command:

```bash
npm run build
```

Output: Next.js default.

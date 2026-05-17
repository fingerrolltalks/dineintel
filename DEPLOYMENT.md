# DineLeak Deployment Notes

## Preflight

Run before every production deploy:

```bash
npm run lint
npm run build
```

## GitHub

Repository:

```text
Connected GitHub repository
```

## Vercel Settings

- Framework preset: Next.js
- Build command: `npm run build`
- Install command: `npm install`
- Output directory: leave blank/default
- Root directory: `.`

## Environment Variables

Set these in Vercel for production:

```text
NEXT_PUBLIC_APP_URL=https://dineleak.app
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini
CRON_SECRET=some-long-random-string
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
DATABASE_URL=postgresql://...
STRIPE_PRICE_REPORT=price_1TWo4BJ9YwzUC7JXLhDnDXYu
STRIPE_PRICE_STARTER=price_1TWo50J9YwzUC7JXf75tNk9N
STRIPE_PRICE_PRO=price_1TWo5vJ9YwzUC7JXtPNW0y6q
```

Local test mode:

```text
NEXT_PUBLIC_APP_URL=http://localhost:3000
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini
CRON_SECRET=some-long-random-string
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
DATABASE_URL=postgresql://...
STRIPE_PRICE_DETAILED_REPORT=price_...
STRIPE_PRICE_STARTER_MONITOR=price_...
STRIPE_PRICE_PRO_MONITOR=price_...
```

Optional future variable:

```text
OPENAI_API_KEY
CRON_SECRET
```

## Database

Production needs a Postgres `DATABASE_URL`.

Recommended setup:

1. Open the Vercel project dashboard.
2. Go to Storage / Marketplace.
3. Add Neon Postgres.
4. Connect it to the `dineleak` project.
5. Confirm Vercel adds `DATABASE_URL` to Production.

After deployment, verify database readiness:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" https://dineleak.app/api/database/health
```

The health route verifies the connection and creates the DineLeak tables if needed.

## Production Verification

After deployment:

- Open the Vercel production URL.
- Confirm the homepage loads.
- Run a sample audit from the form.
- Confirm scan animation reaches results.
- Confirm results cards render.
- Check mobile viewport in browser dev tools.
- Confirm Stripe checkout returns to `https://dineleak.app/success`.
- Confirm webhook logs appear for `checkout.session.completed`.

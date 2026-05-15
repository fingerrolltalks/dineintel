# DineIntel Deployment Notes

## Preflight

Run before every production deploy:

```bash
npm run lint
npm run build
```

## GitHub

Repository:

```text
https://github.com/fingerrolltalks/dineintel
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
NEXT_PUBLIC_APP_URL=https://dineintel.app
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PRICE_DETAILED_REPORT=price_...
STRIPE_PRICE_STARTER_MONITOR=price_...
STRIPE_PRICE_PRO_MONITOR=price_...
```

Local test mode:

```text
NEXT_PUBLIC_APP_URL=http://localhost:3000
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PRICE_DETAILED_REPORT=price_...
STRIPE_PRICE_STARTER_MONITOR=price_...
STRIPE_PRICE_PRO_MONITOR=price_...
```

Optional future variable:

```text
OPENAI_API_KEY
```

## Production Verification

After deployment:

- Open the Vercel production URL.
- Confirm the homepage loads.
- Run a sample audit from the form.
- Confirm scan animation reaches results.
- Confirm results cards render.
- Check mobile viewport in browser dev tools.
- Confirm Stripe checkout returns to `https://dineintel.app/success`.

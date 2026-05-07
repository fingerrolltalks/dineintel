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

None required for MVP.

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

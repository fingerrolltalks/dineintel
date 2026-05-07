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

No environment variables are required for the current MVP.

`OPENAI_API_KEY` is reserved for a future real AI audit integration. The current audit engine uses local simulated scoring.

## Deploy

Recommended hosting: Vercel.

Build command:

```bash
npm run build
```

Output: Next.js default.

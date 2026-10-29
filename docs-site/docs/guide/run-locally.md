---
title: "Run it locally"
description: "Install, create the database, configure and run LifeGrowth on your machine."
---

# Run it locally

## Requirements

- **Node.js 20+** (we use Node 24) and npm.
- A **Supabase** project (free tier), or Docker for a local Supabase.
- Optional: a **Gemini API key** and **Stripe test keys**. Without them the app still runs: AI uses labelled sample values and card payments are off.

## 1. Install

```bash
git clone https://github.com/rarescazan30/hackathon-nexxt.git
cd hackathon-nexxt && npm install
```

## 2. Create the database

1. Create a project at supabase.com.
2. **Authentication → Sign In / Providers → Email**: turn **Confirm email** off.
3. Create every table, policy and storage bucket from the migrations:

```bash
npx supabase login
npx supabase link --project-ref <your-project-ref>
npx supabase db push --linked
```

The migrations live in `supabase/migrations/` and are described in [Data model](../architecture/data-model.md).

## 3. Configure

```bash
cp .env.example .env.local
```

Fill it in: see [Environment variables](../reference/environment.md). Supabase keys are in **Project Settings → API Keys**.

## 4. Seed and run

```bash
npm run seed              # Pillar III product, test user Andrei, admin account
npm run seed:demo-users   # optional: 338 fictional savers for the admin dashboard
npm run dev               # http://localhost:3000
```

For the demo-ready version: `npm run build && npm start`.

## Supabase on your machine (alternative)

With Docker running, `npx supabase start` starts a local Supabase and applies the migrations (email confirmation is already off in `supabase/config.toml`); `npx supabase status` prints the keys for `.env.local`. This path is less tested than a hosted project.

## On a phone through ngrok

Use the production build (`npm run build && npm start`), then `ngrok http 3000`.

:::warning Not with `npm run dev`
The development server only serves its JavaScript to `localhost`. Through a tunnel the HTML loads but nothing is interactive: no dark mode, no 3D island, no buttons.
:::

## Checks before pushing

```bash
npm run lint && npm test && npm run build
```

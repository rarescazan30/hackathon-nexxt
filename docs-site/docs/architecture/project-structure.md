---
title: "Project structure"
description: "Where everything lives in the repository."
---

# Project structure

```text
hackathon-nexxt/
├── app/                      Pages, Server Actions, API routes (Next.js App Router)
│   ├── page.tsx              Landing page
│   ├── login/, register/     Auth pages
│   ├── onboarding/           4-step onboarding + actions.ts (PDF upload, save)
│   ├── app/                  The logged-in app: page.tsx, actions.ts, card-actions.ts
│   ├── admin/                Company dashboard (admin account only)
│   ├── i/[code]/             Public "shared island" page
│   ├── terms/                Plain-English terms
│   └── api/stripe/webhook/   Stripe events
├── components/
│   ├── app/                  Home, Month, Profile screens and their parts
│   ├── onboarding/           The onboarding steps
│   ├── scene/                The low-poly three.js island
│   ├── bank/                 Open Banking (demo) sheet
│   ├── stripe/               Stripe Elements card form
│   ├── pensions/             Pension editor (onboarding + Profile)
│   ├── landing/, auth/       Landing page and auth parts
├── lib/
│   ├── rules/                Money math: pure, integer bani, sourced constants
│   ├── data/                 Loaders: rows → what screens show
│   ├── server/               Monthly flow, mock bank, statement import, Stripe client
│   ├── ai/                   Model switch, PDF reader, monthly message
│   └── supabase/             Clients + generated database types
├── supabase/migrations/      Database schema, policies, buckets
├── scripts/                  Seed scripts (test user, admin, demo savers)
├── data/                     Demo PDFs and the test persona
├── docs/                     Plans, decisions, research (Markdown)
├── docs-site/                This documentation site (Docusaurus)
└── proxy.ts                  Session refresh + route guard
```

## Where to look for…

| I want to change… | Go to |
|---|---|
| A number shown to users | `lib/rules/` (and its tests in `lib/rules/__tests__/`) |
| What a screen shows | `components/app/*-screen.tsx` + `lib/data/app-data.ts` |
| What a button does | the matching Server Action in `app/**/actions.ts` |
| The monthly money flow | `lib/server/money-flow.ts`, `lib/server/jar.ts` |
| The fake bank's transactions | `lib/server/mock-bank.ts` |
| What the AI reads from PDFs | `lib/ai/extract-document.ts` |
| The 3D island | `components/scene/` (`lifestyle-scene.tsx`, `slots/`) |
| The database | a new file in `supabase/migrations/`, then `npx supabase db push` and regenerate types |

## Conventions

- **Money in bani**, always integers. Format only at the edge with `formatRon()`.
- **Relative imports in `lib/`** where scripts reuse the code with `jiti` (the seed scripts).
- **One sentence per file header** explaining what the file is for.
- **App text in English.**

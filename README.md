# LifeGrowth — how will you live in retirement?

**nexxt hackathon · "Rethinking Financial Futures"** — making the financial future more accessible and relevant for people in Romania.

### ▶ Live app: **https://hackathon-nexxt.vercel.app**

LifeGrowth shows people in their 30s **how they would live in retirement**, as a small low-poly 3D island built from their real pension numbers.
Card payments are rounded up; once a month the user adds that money to their **Pillar III** pension with one tap.
Every contribution adds **days of freedom** and XP, and levels upgrade the island from a tent to a villa.

> Hackathon prototype. All money is test money, all bank data is fictional, nothing here is investment advice.

---

## Contents

▶ [Demo video](#demo)

1. [Try it live (5 minutes)](#1-try-it-live-5-minutes)
2. [Sample inputs](#2-sample-inputs)
3. [Tech stack](#3-tech-stack)
4. [Run it locally](#4-run-it-locally)
5. [Environment variables](#5-environment-variables)
6. [Deployment (Vercel)](#6-deployment-vercel)
7. [How it works](#7-how-it-works)
8. [Where AI is used](#8-where-ai-is-used)
9. [Project structure](#9-project-structure)
10. [Scripts](#10-scripts)
11. [Limitations and honesty notes](#11-limitations-and-honesty-notes)
12. [Further docs](#12-further-docs)

---

## Demo

**▶ [Watch the demo video](https://drive.google.com/file/d/1xUv6h8t4mCRzRxVNbeAdPzcL4_i_gMaa/view?usp=drive_link)** (MP4, about 39 MB): a walkthrough of LifeGrowth in use.

If the video doesn't play in the browser, open it and click **Download** (or *View raw*).

Pitch deck: [Life-Growth-334Supremacy-v3.pptx](Life-Growth-334Supremacy-v3.pptx).

---

## 1. Try it live (5 minutes)

Open **https://hackathon-nexxt.vercel.app**, ideally on a phone or at phone width. The demo PDFs are in this repo, in [`data/demo/`](data/demo).

1. **Landing** → **Sign up** (name, any email, a password of 8+ characters).
2. **Your pension documents** → upload `pillar2-statement-demo.pdf` → provider, balance and date are filled in; check them → **Continue**.
3. **Three questions** → birth year `1992`, net salary `6500`, years worked `12`.
4. **The reveal** → your island, expected income at 65, and days of freedom counting up.
5. **Piggy bank** → **Connect your bank** → *Open Banking (demo)*: Demo Bank → card last 4 digits `4821` → any 4-digit code → tick the terms → **Start saving**.
6. **Month** tab → your card payments from the last 3 months with their round-ups, and what round-ups would have saved before you joined.
7. **Profile → Card and bank → Add a card** → Stripe test card `4242 4242 4242 4242`, expiry `12/34`, CVC `123`.
8. **Month → Simulate end of month → Yes, add it** → the card is charged in Stripe test mode and the next month opens.
9. **Home** → drag the island to spin it → **Share my island** → a public link with a preview image.

A scripted version, with what to say at each step, is in [docs/DEMO_SCRIPT.md](docs/DEMO_SCRIPT.md).

---

## 2. Sample inputs

### Documents (fictional, in [`data/demo/`](data/demo))
| File | What the app does with it |
|---|---|
| `pillar2-statement-demo.pdf` | Pillar II statement (NN Pensii) → fills a pension card |
| `pillar3-statement-demo.pdf` | Pillar III statement (BT Pensii, 8,857.26 RON) → a second pension card |
| `bank-statement-demo.pdf` | Bank statement (Demo Bank, 13 lines) → card payments added to the history. Upload it in **Profile → Update details or add a PDF**. Payments already read through Open Banking are recognised and skipped |

When the AI runs in sample mode (`AI_PROVIDER=mock`), the reader picks the sample by file name and labels the result *"Sample values (AI is off in this demo)"*, so these files always work.

### Form values
| Screen | Try |
|---|---|
| Three questions | `1992` · `6500` · `12` |
| Validation | net salary `1`, or `25` years worked at 34 → a friendly error, the button stays off |
| Open Banking (demo) | bank **Demo Bank**, card last 4 `4821`, any 4-digit code |
| Month-end offer | **Another amount** → `150` |

### Stripe test cards (any future expiry, any CVC)
| Card | Result |
|---|---|
| `4242 4242 4242 4242` | always succeeds |
| `4000 0027 6000 3184` | asks for 3-D Secure (click *Complete* or *Fail*) |
| `4000 0000 0000 0341` | saves, but the monthly charge is declined |

More in [docs/STRIPE_TESTING.md](docs/STRIPE_TESTING.md).

---

## 3. Tech stack

| Part | What we use |
|---|---|
| App | **Next.js 16** (App Router, Server Actions, `cacheComponents`), **React 19**, **TypeScript** |
| UI | **Tailwind CSS 4**, lucide icons |
| 3D | **three.js** + **@react-three/fiber** (low-poly scene built from primitives, no model files) |
| Database, auth, files | **Supabase** (Postgres with row-level security, email/password auth, private storage) |
| Payments | **Stripe** in test mode (Stripe Elements card form, SetupIntents, PaymentIntents, webhooks) |
| AI | **Google Gemini** (reads PDFs, writes the monthly message), with a no-key **mock** mode |
| Validation | **Zod** on every server input and every AI answer |
| Hosting | **Vercel** (production deploys from `main`) |
| Tests | Node's built-in test runner via **jiti** |

All npm dependencies are in `package.json` and installed with `npm install`; nothing needs to be installed globally.

---

## 4. Run it locally

### 4.1 Requirements
- **Node.js 20 or newer** (we use Node 24) and npm.
- A **Supabase** project (free tier is enough), or Docker for a local Supabase (see 4.6).
- Optional: a **Gemini API key** (Google AI Studio) and **Stripe test keys**. Without them the app still runs: AI uses labelled sample values and card payments are switched off.

### 4.2 Install
```bash
git clone https://github.com/rarescazan30/hackathon-nexxt.git
```
```bash
cd hackathon-nexxt && npm install
```

### 4.3 Create the database
1. Create a project at supabase.com.
2. **Authentication → Sign In / Providers → Email**: turn **Confirm email** off, so sign-up doesn't wait for an email.
3. Create all tables, policies and storage buckets from our migrations:
```bash
npx supabase login
```
```bash
npx supabase link --project-ref <your-project-ref>
```
```bash
npx supabase db push --linked
```

### 4.4 Configure
```bash
cp .env.example .env.local
```
Fill it in as described in [section 5](#5-environment-variables). Supabase keys are in **Project Settings → API Keys**.

### 4.5 Seed and run
```bash
npm run seed
```
Creates the Pillar III product, the test user **Andrei** (34, six months of history, one level-up away) and the **admin** account.
```bash
npm run seed:demo-users
```
Optional: 338 fictional savers so the admin dashboard has realistic numbers (`npm run seed:demo-users -- --remove` deletes them).
```bash
npm run dev
```
Open http://localhost:3000.

### 4.6 Alternative: Supabase on your machine
With Docker running, `npx supabase start` starts a local Supabase and applies the migrations (email confirmation is already off in `supabase/config.toml`); `npx supabase status` prints the URL and keys for `.env.local`. We developed against a hosted project, so this path is less tested.

### 4.7 Opening a local copy on a phone
Use the production build, `npm run build && npm start`, then `ngrok http 3000`. The development server (`npm run dev`) doesn't serve its JavaScript to other hostnames, so through a tunnel the page would load without interactivity.

### 4.8 Checks
```bash
npm run lint && npm test && npm run build
```

---

## 5. Environment variables

Locally they go in `.env.local` (never committed; `.env.example` lists them). On Vercel they go in **Settings → Environment Variables**.

| Variable | Needed? | What it is |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | **yes** | Supabase project URL (public by design) |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | **yes** | Supabase publishable key, `sb_publishable_…` (public by design) |
| `SUPABASE_SECRET_KEY` | **yes** | Supabase secret key, `sb_secret_…`; server only |
| `AI_PROVIDER` | optional | `gemini`, `groq` or `mock`. With `mock` (or no key) PDFs return labelled sample values |
| `GOOGLE_GENERATIVE_AI_API_KEY` (or `GEMINI_API_KEY`) | optional | Gemini API key, for reading PDFs and writing the monthly message |
| `GROQ_API_KEY` | optional | alternative text model (it can't read PDFs) |
| `STRIPE_SECRET_KEY` | optional | Stripe **test** secret key, `sk_test_…`; live keys are refused |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | optional | Stripe **test** publishable key, `pk_test_…` |
| `STRIPE_WEBHOOK_SECRET` | optional | `whsec_…`, from `stripe listen` or the Stripe dashboard |
| `ADMIN_EMAIL` | for the admin panel | the account that sees **Admin** and `/admin` |
| `ADMIN_PASSWORD` | local only | used by `npm run seed` to create the admin account |
| `DEMO_USER_EMAIL`, `DEMO_USER_PASSWORD` | local only | used by `npm run seed` to create the test user |

Only the three `NEXT_PUBLIC_…` values reach the browser; they are meant to be public. Restart the server (locally) or redeploy (on Vercel) after changing variables.

---

## 6. Deployment (Vercel)

The live app is **https://hackathon-nexxt.vercel.app**, deployed by Vercel from the `main` branch: every push to `main` builds and publishes a new version.

To deploy your own copy:
1. Import the GitHub repository in Vercel (framework: Next.js, default build settings).
2. Add the environment variables from [section 5](#5-environment-variables) under **Settings → Environment Variables** (Production, and Preview if you use previews). You can paste a whole `.env` file into the *Key* field; leave out the local-only ones and remove end-of-line comments.
3. **Deployments → latest → ⋯ → Redeploy** after adding or changing variables: they are read at build time.
4. In Supabase, **Authentication → URL Configuration**: set the Site URL to your Vercel address.
5. Optional, for Stripe webhooks: in the Stripe dashboard (test mode) add an endpoint `https://<your-app>/api/stripe/webhook` for `payment_intent.succeeded` and `payment_intent.payment_failed`, and put its signing secret in `STRIPE_WEBHOOK_SECRET`.

If every page returns *Internal Server Error*, a Supabase variable is missing or misnamed: the session check in `proxy.ts` runs before every page and needs the URL and publishable key.

---

## 7. How it works

**From documents to an island.** The reveal adds up the state pension (scaled by contribution years), Pillar II (today's balance plus future contributions of 4.75% of gross salary) and Pillar III. Savings grow at the pension funds' long-run return minus **Romania's average inflation of the last 10 years** (INS, ~5.2% a year, so ~2.2% real). The result is compared with today's salary and mapped to one of five lifestyle tiers.

**Days of freedom.** Savings grown to 65, in today's money, divided by the daily gap between the state pension and a comfortable retirement (65% of salary).

**The monthly loop.**
```
card payments (Open Banking, demo) ──► round-ups + % of salary ──► monthly counter
month end: "Add 225 RON to your Pillar III?" ──► Yes ──► Stripe charges the saved card
──► held one month by the banking partner (the interest is our revenue) ──► Pillar III
```
Two separate jobs: **Open Banking (PSD2) only reads** payments to compute round-ups; **Stripe only charges** the monthly amount, after the user's yes.

**Business model.** While each month's amount is held for one month it earns interest (assumed 5% a year), kept by LifeGrowth and its banking partner; the user never pays a fee. It is disclosed in the terms and on every offer. Legal context: [docs/FLOAT_LEGAL.md](docs/FLOAT_LEGAL.md).

**Security.**
- Row-level security on every table.
- The user id always comes from the session, never from the browser.
- Card numbers never reach our server (Stripe Elements); we store only the brand and last 4 digits.
- Stripe webhooks are signature-checked and de-duplicated.
- Pension PDFs go to a private, per-user storage folder.

**Pages.**
| URL | What |
|---|---|
| `/` | landing page; details behind "Find out more" |
| `/register`, `/login` | email/password auth |
| `/onboarding` | documents → 3 questions → reveal → piggy bank |
| `/app` | Home (days, island, level, share), Month (offer, card payments), Profile (details, card and bank) |
| `/i/<code>` | public shared island (first name and level only) |
| `/admin` | company dashboard, admin account only |
| `/terms` | plain-English terms |
| `/api/stripe/webhook` | Stripe test-mode events |

---

## 8. Where AI is used

| Feature | How |
|---|---|
| **Reading PDFs** | Gemini reads a pension statement (provider, balance, date) or a bank statement (transactions). Our code validates the answer with Zod and converts it to integer bani; the **user always checks** pension values before saving. If reading fails, a form opens to type the numbers in |
| **Monthly message** | Gemini phrases one short sentence ("You saved 225 RON in October…") from numbers our code computed. If it doesn't use those exact numbers, a fixed sentence is used instead |

All financial calculations are plain, tested code in `lib/rules/`, never the model. Details: [docs/PDF_READER.md](docs/PDF_READER.md).

---

## 9. Project structure

| Path | What |
|---|---|
| `app/` | pages, server actions (`app/app/actions.ts`, `app/app/card-actions.ts`, `app/onboarding/actions.ts`) and the Stripe webhook |
| `components/` | screens (`app/`), onboarding, landing, auth, the 3D scene (`scene/`), Open Banking (`bank/`), Stripe form (`stripe/`) |
| `lib/rules/` | all money math: deterministic, integer bani, named and sourced constants |
| `lib/data/` | turns database rows into what the screens show |
| `lib/server/` | monthly flow (offer → collect → invest), mock bank, statement import, Stripe client |
| `lib/ai/` | model switch, PDF reader (pension or bank statement), monthly message |
| `supabase/migrations/` | database schema, policies and storage buckets |
| `scripts/` | seed scripts |
| `data/` | fictional demo PDFs and the test persona |
| `docs/` | plans, decisions, research and guides |

---

## 10. Scripts

| Command | What it does |
|---|---|
| `npm run dev` | development server on http://localhost:3000 |
| `npm run build` / `npm start` | production build / serve it |
| `npm run lint` | ESLint |
| `npm test` | unit tests: money math, personas, lifestyle model, AI fallbacks |
| `npm run seed` | Pillar III product, test user Andrei, admin account |
| `npm run seed:demo-users` | 338 fictional savers for the admin dashboard (`-- --remove` deletes them) |

---

## 11. Limitations and honesty notes

- **Open Banking is simulated.** "Demo Bank" and its transactions come from `lib/server/mock-bank.ts`. Production would use a licensed PSD2 provider ([docs/BANK_IMPLEMENTATION.md](docs/BANK_IMPLEMENTATION.md)).
- **No real money moves.** Stripe runs in test mode; "investing in Pillar III" is recorded in the database only.
- **"Simulate end of month"** is a demo button that moves time forward.
- **AI may run in sample mode** on the live app; uploads then say so on screen.
- **Estimates, not advice.** Pension projections use cautious, sourced assumptions (`lib/rules/config.ts`); the 2025 inflation figure comes from secondary sources citing INS.
- **The admin dashboard** includes fictional savers created by `seed:demo-users`.

---

## 12. Further docs

| Doc | About |
|---|---|
| [docs/DEMO_SCRIPT.md](docs/DEMO_SCRIPT.md) | the 4-minute demo, step by step |
| [docs/plan.md](docs/plan.md) | product plan: numbers, money flow, screens |
| [docs/architecture.md](docs/architecture.md) | how the pieces fit |
| [docs/decisions.md](docs/decisions.md) | decisions log |
| [docs/STRIPE_TESTING.md](docs/STRIPE_TESTING.md) | testing card payments |
| [docs/PDF_READER.md](docs/PDF_READER.md) | the document reader |
| [docs/BANK_IMPLEMENTATION.md](docs/BANK_IMPLEMENTATION.md) | the real PSD2 integration path |
| [docs/FLOAT_LEGAL.md](docs/FLOAT_LEGAL.md) | is holding money for a month legal? |
| [docs/TIPS.md](docs/TIPS.md) | more data we could read from documents |
| [AGENTS.md](AGENTS.md) | team rules and change log |

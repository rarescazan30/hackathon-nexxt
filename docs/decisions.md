# Decisions log

One short entry per decision, newest first. Format:
**date – decision.** Why. Alternatives considered.

---

**2026-10-28 – Frontend starts from the v0 prototype.** Merged into the repo on npm and
our existing Next.js/ESLint config (v0's pnpm setup and `ignoreBuildErrors` were dropped).
The single page was split into one file per tab in `components/app/` so people can work
in parallel. Original export kept outside the repo in `../v0-prototype-original`.

**2026-10-28 – One Next.js + TypeScript app, deployed on Vercel.** One language, shared
types between UI and backend, free hosting, no separate backend server.
Alternative: FastAPI (Python) backend on Railway/Render; rejected because we don't do
ML training and it adds a second deploy.

**2026-10-28 – Free AI only: Gemini free tier, Groq fallback, via Vercel AI SDK.**
No budget for AI credits. The SDK lets us switch provider with one env var.

**2026-10-28 – Investing is simulated in a ledger; collection uses Stripe test mode.**
No public API lets a startup invest in Romanian products automatically; in production
Raiffeisen or a licensed partner executes. Stripe shows the automatic collection for real.

**2026-10-28 – Positioning: not a budgeting app.** The home screen shows days of
freedom and the jar, not spending categories.

**2026-10-28 – Plan v2: retirement lifestyle app.** One problem (people can't picture
retirement), one product (Pillar III), one loop (round-ups → monthly yes → scene levels
up). Replaces risk profiles, ETF/bond allocation and the chat agent. Details: `docs/plan.md`.

**2026-10-28 – Business model: interest on a one-month hold.** Mentor's advice. A licensed
banking partner holds each confirmed amount for one month; the interest is our revenue.
Disclosed on the confirm screen and in `/terms`.

**2026-10-28 – All app text in English.** Money shown as `1,293.50 RON`.

**2026-10-28 – Low-poly 3D in code.** three.js + react-three-fiber with primitives only,
no model files; 2D fallback without WebGL.

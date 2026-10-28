# components/: reusable UI components

Owner: **Frontend Lead**. Read the root `AGENTS.md` and `app/AGENTS.md` first.

## Layout

- `components/app/`: the 3 app screens (`home-screen`, `month-screen`, `profile-screen`),
  `app-shell` (tabs), `level-up-overlay`, and `shell.tsx` (Logo, Card, Header, BottomNav).
- `components/scene/`: the low-poly three.js scene. Import `LifestyleScene` from
  `components/scene` (client-only, lazy). Models are built from primitives in `parts.tsx`;
  one file per slot in `slots/`. Try changes on `/dev/scene`.
- `components/onboarding/`, `components/landing/`, `components/auth/`: one file per step/section.
- `components/ui/`: shadcn/ui primitives (`npx shadcn add <name>`).

## Rules

- Screens receive data as props (`AppData` from `lib/data/app-data.ts`). No fetching and
  no hard-coded data inside components.
- Same look everywhere: background `#f7f6f9` / `#18151f`, `Card` (rounded 24px), deep purple
  `#33256c` buttons, lavender `#8c7ad9` uppercase eyebrows, mint for growth. Use the same
  hex classes as the existing screens.
- All text in English; money with `formatRon()`, days with `formatFreedom()`.
- Accessible by default: real buttons and labels, sufficient contrast, readable font sizes.

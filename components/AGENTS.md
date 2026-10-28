# components/: reusable UI components

Owner: **Frontend Lead**. Read the root `AGENTS.md` and `app/AGENTS.md` first.

## Rules

- Components receive data as **props typed from `lib/contracts.ts`**. No fetching and no
  hard-coded data inside components.
- Use shadcn/ui primitives and Tailwind; keep one visual style across the app.
- Components generated with v0 or other tools get cleaned up before merging: real
  props, no fake inline data, no unused code.
- Accessible by default: real buttons and labels, sufficient contrast, readable font sizes.

## Planned components (draft)

- `DaysOfFreedom`: the big number, shown as a range, tappable for its explanation
- `JarCard`: round-ups collected this month and the next collection date
- `AllocationBar`: how a collection is split by risk level
- `SourceChip`: a small link to the source behind a number or claim
- `ChatResultCard`: renders a tool result inside the chat

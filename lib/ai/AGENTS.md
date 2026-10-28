# lib/ai/: agent, tools, prompts, model provider

Owner: **AI Engineer**. Read the root `AGENTS.md` first.

## Purpose

Everything that talks to an LLM: the "what if…?" agent, transaction categorization,
bank-statement extraction, explanations of numbers.

## Rules

- Use the **Vercel AI SDK**. Check the installed major version before writing code:
  names changed between versions (e.g. tool `parameters` → `inputSchema`, `maxSteps` →
  `stopWhen`).
- One provider switch in `model.ts`, controlled by `AI_PROVIDER` (`gemini` | `groq` |
  `mock`). The `mock` provider must work without any API key, for demos and tests.
- **The model never calculates money.** Any number comes from a tool that calls
  `lib/rules/`. The system prompt says so explicitly.
- Tool input schemas and structured outputs use Zod, ideally from `lib/contracts.ts`.
- Answers about rules or products cite sources returned by `lib/rag/`.
- No investment advice: offer scenarios, let the user choose; when unsure, say so and
  suggest talking to a bank advisor.
- Answer in English (all app text is English).
- Only mock data goes into prompts (free tiers may use prompts for training).
- Cache answers for the demo persona so the live demo doesn't depend on rate limits.

## Files

- `model.ts`: provider switch (`AI_PROVIDER`: gemini | groq | mock) and `callModel()`.
- `monthly-message.ts`: the month-end offer sentence; numbers are passed in, never invented.
- `extract-statement.ts`: reads a Pillar II/III statement PDF (Gemini) → `StatementExtract`;
  on mock it returns clearly labelled sample values.
- Tests: `__tests__/ai.test.ts` (run with `npm test`, mock provider).

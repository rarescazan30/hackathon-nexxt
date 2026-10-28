# lib/rag/: ingestion, retrieval, evals

Owner: **RAG + DevOps**. Read the root `AGENTS.md` first.

## Purpose

Lets the agent answer questions about pensions, Pillar III, funds, government bonds
and regulation, **with citations** to official sources.

## Rules

- A small, curated corpus beats a big one: 30–60 official documents in `data/corpus/`.
- Every chunk stores metadata: source title, URL, section/article, year.
- Chunk legal texts by article or section, not by fixed character count.
- Hybrid search in Supabase: pgvector similarity plus Postgres full-text search
  (`romanian` config).
- `searchKnowledge(query, k)` is the only function other areas call. Its return type
  lives in `lib/contracts.ts`. Ship a stub returning mock chunks first, so the AI
  Engineer isn't blocked.
- Keep an eval set (question → expected source) and a script that reports the
  retrieval hit rate. The number goes on a pitch slide.

## Planned pieces (draft)

- `ingest.ts`: parse → chunk → embed → store
- `search.ts`: hybrid retrieval
- `evals/`: questions, expected sources, runner

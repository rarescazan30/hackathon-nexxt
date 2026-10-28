-- Plan v2.3: the PDF reader also takes bank statements (their card payments become
-- transactions for round-ups). An upload's kind can now be 'bank'.
alter table public.statement_uploads drop constraint statement_uploads_kind_check;
alter table public.statement_uploads
    add constraint statement_uploads_kind_check check (kind in ('pillar2', 'pillar3', 'bank'));

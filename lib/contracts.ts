// Shared data shapes for the whole team. Changing this file needs a heads-up to
// everyone and approval from two people (see AGENTS.md).
// Draft: the idea is not final, so expect these schemas to evolve.
import { z } from "zod";

// Money is always integer bani: 5000 = 50.00 lei.
export const Bani = z.number().int();

export const RiskLevel = z.enum(["low", "medium", "high"]);
export type RiskLevel = z.infer<typeof RiskLevel>;

// A bank transaction in the NextGenPSD2 shape (as used by data/mock/).
export const Psd2Transaction = z.object({
  transactionId: z.string(),
  bookingDate: z.string(),
  valueDate: z.string().optional(),
  transactionAmount: z.object({
    amount: z.string().regex(/^-?\d+(\.\d{1,2})?$/),
    currency: z.string(),
  }),
  creditorName: z.string().optional(),
  debtorName: z.string().optional(),
  remittanceInformationUnstructured: z.string().optional(),
});
export type Psd2Transaction = z.infer<typeof Psd2Transaction>;

// One round-up generated from one card payment.
export const RoundUp = z.object({
  transactionId: z.string(),
  spentBani: Bani,
  roundUpBani: Bani,
});
export type RoundUp = z.infer<typeof RoundUp>;

// Days of freedom are always a range, never one exact number.
export const DaysOfFreedom = z.object({
  pessimistic: z.number().int(),
  base: z.number().int(),
  optimistic: z.number().int(),
});
export type DaysOfFreedom = z.infer<typeof DaysOfFreedom>;

// A fragment of an official document returned by lib/rag.
export const Chunk = z.object({
  content: z.string(),
  sourceTitle: z.string(),
  sourceUrl: z.string(),
  section: z.string().optional(),
  year: z.number().int().optional(),
});
export type Chunk = z.infer<typeof Chunk>;

// What the AI reads from an uploaded pension statement (lib/ai/extract-statement.ts).
// Money is converted to bani by our code, never by the model.
export const StatementExtract = z.object({
  kind: z.enum(["pillar2", "pillar3"]),
  provider: z.string(),
  balanceBani: Bani.nonnegative(),
  asOf: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});
export type StatementExtract = z.infer<typeof StatementExtract>;

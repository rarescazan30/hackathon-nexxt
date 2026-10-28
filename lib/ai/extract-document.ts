// Reads an uploaded PDF and says what it is (docs/PDF_READER.md):
//   - a pension statement (Pillar II / III) → provider, balance, date
//   - a bank statement → its transactions (date, merchant, amount)
// The model only reads; our code converts to bani and validates everything with Zod.
import { z } from "zod";
import { StatementExtract } from "../contracts";
import { MOCK_EXTRACT } from "./extract-statement";
import { callModel, getActiveAiProvider } from "./model";

const MAX_TRANSACTIONS = 300;

const SYSTEM = `You read Romanian financial PDFs. First decide what the document is, then answer with JSON only.

1. A private pension statement (Pillar II "pensie administrată privat" or Pillar III "pensie facultativă"):
{"type": "pension", "kind": "pillar2" | "pillar3", "provider": string, "balanceRon": number, "asOf": "YYYY-MM-DD"}
- balanceRon: the total account value (valoarea totală a contului / activul personal), plain number in RON.
- asOf: the date that balance refers to (the latest one if there are several).

2. A bank account or card statement (extras de cont):
{"type": "bank", "transactions": [{"date": "YYYY-MM-DD", "merchant": string, "amountRon": number, "isCardPayment": boolean}]}
- amountRon: negative for money going out, positive for money coming in.
- merchant: the shop or counterparty name as written, without card numbers.
- isCardPayment: true for card purchases (POS, online card payments), false for transfers, salary, fees, cash.
- At most ${MAX_TRANSACTIONS} transactions.

3. Anything else: {"error": "not_a_statement"}`;

const PensionAnswer = z.object({
  type: z.literal("pension"),
  kind: z.enum(["pillar2", "pillar3"]),
  provider: z.string().min(1),
  balanceRon: z.number().nonnegative(),
  asOf: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

const BankAnswer = z.object({
  type: z.literal("bank"),
  transactions: z
    .array(
      z.object({
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        merchant: z.string().trim().min(1).max(80),
        amountRon: z.number().refine((n) => n !== 0 && Math.abs(n) < 1_000_000),
        isCardPayment: z.boolean(),
      })
    )
    .min(1)
    .max(MAX_TRANSACTIONS),
});

export interface StatementTransaction {
  date: string;
  merchant: string;
  /** Negative = money out, in bani. */
  amountBani: number;
  isCardPayment: boolean;
}

export type DocumentResult =
  | { ok: true; type: "pension"; extract: StatementExtract; source: "ai" | "sample" }
  | { ok: true; type: "bank"; transactions: StatementTransaction[]; source: "ai" | "sample" }
  | { ok: false; reason: "not_a_statement" | "unreadable" };

/**
 * Sample bank statement when AI is off (AI_PROVIDER=mock): the same payments as
 * data/demo/bank-statement-demo.pdf, so the demo works without a key.
 */
export const MOCK_BANK_TRANSACTIONS: StatementTransaction[] = [
  { date: "2026-10-02", merchant: "LIDL 0123 BUCURESTI", amountBani: -14696, isCardPayment: true },
  { date: "2026-10-04", merchant: "BOLT.EU", amountBani: -2370, isCardPayment: true },
  { date: "2026-10-06", merchant: "GLOVO RO", amountBani: -5631, isCardPayment: true },
  { date: "2026-10-07", merchant: "MEGA IMAGE 0457", amountBani: -3845, isCardPayment: true },
  { date: "2026-10-09", merchant: "OMV PETROM 211", amountBani: -21460, isCardPayment: true },
  { date: "2026-10-11", merchant: "SPOTIFY", amountBani: -2799, isCardPayment: true },
  { date: "2026-10-13", merchant: "EMAG.RO", amountBani: -18999, isCardPayment: true },
  { date: "2026-10-15", merchant: "SALARIU OCTOMBRIE", amountBani: 650000, isCardPayment: false },
  { date: "2026-10-17", merchant: "KFC AFI COTROCENI", amountBani: -4250, isCardPayment: true },
  { date: "2026-10-19", merchant: "DM DROGERIE", amountBani: -6712, isCardPayment: true },
  { date: "2026-10-21", merchant: "IKEA PIPERA", amountBani: -31990, isCardPayment: true },
  { date: "2026-10-23", merchant: "UBER TRIP", amountBani: -2860, isCardPayment: true },
  { date: "2026-10-25", merchant: "TRANSFER CHIRIE", amountBani: -180000, isCardPayment: false },
];

/** With AI off, guess the type from the file name (demo files say "pillar" or "bank"). */
function sampleFor(fileName: string): DocumentResult {
  if (/bank|banca|extras/i.test(fileName) && !/pillar|pilon|pensi/i.test(fileName)) {
    return { ok: true, type: "bank", transactions: MOCK_BANK_TRANSACTIONS, source: "sample" };
  }
  return { ok: true, type: "pension", extract: MOCK_EXTRACT, source: "sample" };
}

export async function extractDocument(pdf: Uint8Array, fileName: string): Promise<DocumentResult> {
  if (getActiveAiProvider() === "mock") return sampleFor(fileName);

  const result = await callModel({
    system: SYSTEM,
    prompt: "Read this document.",
    pdfBase64: Buffer.from(pdf).toString("base64"),
    json: true,
    maxOutputTokens: 16_000,
  });
  if (!result) return { ok: false, reason: "unreadable" };

  try {
    const raw = JSON.parse(result.text.replace(/^```(json)?|```$/g, "").trim());
    if (raw?.error === "not_a_statement") return { ok: false, reason: "not_a_statement" };
    if (raw?.type === "bank") {
      const answer = BankAnswer.parse(raw);
      return {
        ok: true,
        type: "bank",
        source: "ai",
        transactions: answer.transactions.map((t) => ({
          date: t.date,
          merchant: t.merchant,
          amountBani: Math.round(t.amountRon * 100),
          isCardPayment: t.isCardPayment && t.amountRon < 0,
        })),
      };
    }
    const answer = PensionAnswer.parse(raw);
    const extract = StatementExtract.parse({
      kind: answer.kind,
      provider: answer.provider,
      balanceBani: Math.round(answer.balanceRon * 100),
      asOf: answer.asOf,
    });
    return { ok: true, type: "pension", extract, source: "ai" };
  } catch {
    return { ok: false, reason: "unreadable" };
  }
}

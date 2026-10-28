// Reads a Pillar II / Pillar III statement (PDF) and returns provider, balance and date.
// The model returns the balance in RON as written; our code converts it to bani and
// validates everything with Zod. The user always confirms before anything is saved.
import { z } from "zod";
import { StatementExtract } from "../contracts";
import { callModel, getActiveAiProvider } from "./model";

const SYSTEM = `You read Romanian private pension statements (Pillar II "pensie administrată privat" or
Pillar III "pensie facultativă"). Answer with JSON only:
{"kind": "pillar2" | "pillar3", "provider": string, "balanceRon": number, "asOf": "YYYY-MM-DD"}
- balanceRon: the total account value (valoarea totală a contului / activul personal) in RON, as a plain number.
- asOf: the date that balance refers to.
- If the document is not a pension statement, answer {"error": "not_a_statement"}.`;

const ModelAnswer = z.object({
  kind: z.enum(["pillar2", "pillar3"]),
  provider: z.string().min(1),
  balanceRon: z.number().nonnegative(),
  asOf: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

/** Sample values shown when AI is off (AI_PROVIDER=mock), so the demo flow still works. */
export const MOCK_EXTRACT: StatementExtract = {
  kind: "pillar2",
  provider: "NN Pensii",
  balanceBani: 4200000,
  asOf: "2026-09-30",
};

export type ExtractResult =
  | { ok: true; extract: StatementExtract; source: "ai" | "sample" }
  | { ok: false; reason: "not_a_statement" | "unreadable" };

export async function extractStatement(pdf: Uint8Array): Promise<ExtractResult> {
  if (getActiveAiProvider() === "mock") {
    return { ok: true, extract: MOCK_EXTRACT, source: "sample" };
  }

  const result = await callModel({
    system: SYSTEM,
    prompt: "Read this statement.",
    pdfBase64: Buffer.from(pdf).toString("base64"),
    json: true,
  });
  if (!result) return { ok: false, reason: "unreadable" };

  try {
    const raw = JSON.parse(result.text.replace(/^```(json)?|```$/g, "").trim());
    if (raw?.error === "not_a_statement") return { ok: false, reason: "not_a_statement" };
    const answer = ModelAnswer.parse(raw);
    const extract = StatementExtract.parse({
      kind: answer.kind,
      provider: answer.provider,
      balanceBani: Math.round(answer.balanceRon * 100),
      asOf: answer.asOf,
    });
    return { ok: true, extract, source: "ai" };
  } catch {
    return { ok: false, reason: "unreadable" };
  }
}

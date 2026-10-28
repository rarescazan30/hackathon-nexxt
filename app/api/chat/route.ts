import { NextResponse } from "next/server";
import { z } from "zod";
import { RiskLevel } from "@/lib/contracts";
import { runAgent } from "@/lib/ai/agent";
import type { AgentToolResult } from "@/lib/ai/tools";

const RoundUpRuleSchema = z.object({
  percentage: z.number().optional(),
  chosenTotalBani: z.number().int().optional(),
  roundTo: z.enum(["lei", "bani"]).optional(),
  stepBani: z.number().int().optional(),
  multiplier: z.number().int().optional(),
});

const ChatRequestSchema = z.object({
  message: z.string().min(1).max(1000),
  context: z
    .object({
      name: z.string().optional(),
      age: z.number().int().min(18).max(80).optional(),
      salaryBani: z.number().int().nonnegative().optional(),
      pillarTwoBani: z.number().int().nonnegative().optional(),
      paydaySavingBani: z.number().int().nonnegative().optional(),
      riskLevel: RiskLevel.optional(),
      roundUpRule: RoundUpRuleSchema.optional(),
    })
    .optional(),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string(),
      })
    )
    .optional(),
  lastToolResult: z.custom<AgentToolResult>().optional(),
  explicitAction: z
    .object({
      type: z.enum(["update_roundup", "simulate_roundup", "change_risk", "what_if"]),
      roundUpRule: RoundUpRuleSchema.optional(),
      riskLevel: RiskLevel.optional(),
      extraMonthlyBani: z.number().int().nonnegative().optional(),
      sampleAmountBani: z.number().int().positive().optional(),
    })
    .optional(),
});

export async function POST(req: Request) {
  try {
    const rawBody = await req.json();
    const parsed = ChatRequestSchema.safeParse(rawBody);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Datele trimise sunt invalide.",
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const result = await runAgent(parsed.data);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: "Nu am putut procesa mesajul. Încearcă din nou." },
      { status: 500 }
    );
  }
}

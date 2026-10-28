// Core AI Agent Orchestrator.
// 1. Parses user intent (round-up simulation vs change, risk change, what-if projection, number explanation, knowledge query).
// 2. Runs pure deterministic tools from lib/ai/tools.ts (backed by lib/rules/) so numbers are 100% exact.
// 3. Calls Gemini / Groq (via generateNaturalLanguageExplanation) with those exact deterministic numbers so the AI writes a natural, contextual response!

import type { Chunk, RiskLevel } from "../contracts";
import { formatBaniToLei, type RoundUpRule } from "../rules";
import { type AiProvider, generateNaturalLanguageExplanation } from "./model";
import {
  type AgentToolResult,
  DEFAULT_USER_CONTEXT,
  describeRiskLevelRo,
  executeCalculateProjection,
  executeChangeRiskAllocation,
  executeExplainNumber,
  executeUpdateRoundUpRule,
  searchKnowledge,
  type UserFinancialContext,
} from "./tools";

export interface ConversationTurn {
  role: "user" | "assistant";
  content: string;
}

export interface AgentRunInput {
  message: string;
  context?: Partial<UserFinancialContext>;
  history?: ConversationTurn[];
  lastToolResult?: AgentToolResult;
  explicitAction?: {
    type: "update_roundup" | "simulate_roundup" | "change_risk" | "what_if";
    roundUpRule?: RoundUpRule;
    riskLevel?: RiskLevel;
    extraMonthlyBani?: number;
    sampleAmountBani?: number;
  };
}

export interface AgentRunOutput {
  reply: string;
  provider: AiProvider | "deterministic";
  toolResult?: AgentToolResult;
  sources: Chunk[];
  updatedContext: UserFinancialContext;
}

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

/**
 * Determines whether a command is a hypothetical "What-If" simulation
 * ("Ce-ar fi dacă...", "Dacă rotunjirea devine...", "What if...", "Simulează...")
 * vs. a direct mutation ("Setează...", "Schimbă...", "Activează...", "Vreau să schimb...").
 */
function detectCommandMode(normText: string): "simulated" | "applied" {
  const isWhatIf =
    normText.includes("ce-ar fi") ||
    normText.includes("ce ar fi") ||
    normText.includes("what if") ||
    normText.includes("daca ") ||
    normText.startsWith("daca") ||
    normText.includes("ar deveni") ||
    normText.includes("devine") ||
    normText.includes("simuleaza") ||
    normText.includes("simulare") ||
    normText.includes("cum ar fi");

  const isExplicitApply =
    normText.includes("seteaza") ||
    normText.includes("schimba") ||
    normText.includes("vreau sa schimb") ||
    normText.includes("activeaza") ||
    normText.includes("aplica") ||
    normText.includes("pune ") ||
    normText.includes("vreau sa setezi") ||
    normText.startsWith("rotunjeste la");

  if (isWhatIf && !isExplicitApply) {
    return "simulated";
  }
  return "applied";
}

/**
 * Extracts a round-up rule AND whether it is a simulation ("what if") vs committed change ("set").
 * Supports ANY percentage (1% - 100%), any step in lei (1 - 100 lei), multipliers (2x, 3x, 5x), and custom totals.
 */
export function parseRoundUpIntent(text: string): {
  matched: boolean;
  mode: "simulated" | "applied";
  rule?: RoundUpRule;
  sampleAmountBani?: number;
} {
  const norm = normalizeText(text);
  const mode = detectCommandMode(norm);

  // 1. Check if user specifies a custom payment & total: e.g. "pentru 12,30 lei ... 15 lei"
  const twoNumbersMatch = norm.match(
    /(\d+(?:[.,]\d{1,2})?)\s*lei.*?(?:la|platesc|total)\s*(\d+(?:[.,]\d{1,2})?)\s*lei/
  );
  if (twoNumbersMatch) {
    const spent = Math.round(parseFloat(twoNumbersMatch[1].replace(",", ".")) * 100);
    const chosen = Math.round(parseFloat(twoNumbersMatch[2].replace(",", ".")) * 100);
    if (spent > 0 && chosen > spent) {
      return {
        matched: true,
        mode,
        rule: { chosenTotalBani: chosen },
        sampleAmountBani: spent,
      };
    }
  }

  const hasRoundUpKeyword =
    norm.includes("rotunj") ||
    norm.includes("round") ||
    norm.includes("pas ") ||
    norm.includes("pasul") ||
    norm.includes("multipl") ||
    norm.includes("procent") ||
    /\b\d+(?:[.,]\d+)?\s*%/.test(norm) ||
    /\b[235]x\b/.test(norm);

  if (!hasRoundUpKeyword) {
    return { matched: false, mode: "applied" };
  }

  // 2. Check ANY percentage mode (e.g. 1%, 2%, 5%, 10%, 15%, 20%, 30%, 50%)
  const pctMatch = norm.match(/(\d+(?:[.,]\d+)?)\s*%/);
  if (pctMatch) {
    const rawPct = parseFloat(pctMatch[1].replace(",", "."));
    const pct = Math.max(0.5, Math.min(100, rawPct));
    const multMatch = norm.match(/\b([1-9])\s*x\b/);
    const multiplier = multMatch ? parseInt(multMatch[1], 10) : 1;
    // Use exact bani calculation for small/custom percentages (like 1%, 2%, 5%), and whole-Leu rounding for 10/20/30%
    const roundTo: "lei" | "bani" =
      pct === 10 || pct === 20 || pct === 30 ? "lei" : "bani";

    return {
      matched: true,
      mode,
      rule: { percentage: pct, roundTo, multiplier },
    };
  }

  // 3. Check multiplier & step in lei
  const multMatch = norm.match(/\b([1-9])\s*x\b/);
  const hasWordMultiplier = norm.includes("dublu") || norm.includes("triplu");
  const multiplier = multMatch
    ? parseInt(multMatch[1], 10)
    : norm.includes("dublu")
      ? 2
      : norm.includes("triplu")
        ? 3
        : 1;

  const stepMatch = norm.match(/(?:la|pas|pasul|devine|fi|multiplu(?:\s+de)?)\s*(\d+)\s*le[iu]/);
  const anyLeiMatch = norm.match(/(\d+)\s*le[iu]/);

  // Only match step mode if the user actually specified a number of lei or a multiplier!
  if (!stepMatch && !anyLeiMatch && !multMatch && !hasWordMultiplier) {
    return { matched: false, mode: "applied" };
  }

  const stepLei = stepMatch
    ? parseInt(stepMatch[1], 10)
    : anyLeiMatch
      ? parseInt(anyLeiMatch[1], 10)
      : 5;

  const clampedStepLei = Math.max(1, Math.min(100, stepLei));

  return {
    matched: true,
    mode,
    rule: {
      stepBani: clampedStepLei * 100,
      multiplier,
    },
  };
}

function parseRiskIntent(text: string): { risk: RiskLevel; mode: "simulated" | "applied" } | null {
  const norm = normalizeText(text);
  const mentionsRiskOrSwitch =
    norm.includes("risc") ||
    norm.includes("profil") ||
    norm.includes("schimba") ||
    norm.includes("seteaza") ||
    norm.includes("aloca") ||
    norm.includes("titluri de stat") ||
    norm.includes("conservator") ||
    norm.includes("agresiv") ||
    norm.includes("dinamic");

  if (!mentionsRiskOrSwitch) return null;

  const mode = detectCommandMode(norm);

  if (
    norm.includes("scazut") ||
    norm.includes("conservator") ||
    norm.includes("sigur") ||
    norm.includes("titluri de stat") ||
    norm.includes("low")
  ) {
    return { risk: "low", mode };
  }
  if (
    norm.includes("ridicat") ||
    norm.includes("agresiv") ||
    norm.includes("dinamic") ||
    norm.includes("high")
  ) {
    return { risk: "high", mode };
  }
  if (norm.includes("mediu") || norm.includes("echilibrat") || norm.includes("medium")) {
    return { risk: "medium", mode };
  }
  return null;
}

function parseWhatIfProjectionIntent(text: string): {
  matched: boolean;
  extraMonthlyBani: number;
  years?: number;
} {
  const norm = normalizeText(text);
  // Don't hijack round-up what-ifs here
  if (norm.includes("rotunj") || norm.includes("round") || norm.includes("%")) {
    return { matched: false, extraMonthlyBani: 0 };
  }

  const isWhatIf =
    norm.includes("daca adaug") ||
    norm.includes("daca pun") ||
    norm.includes("daca economisesc") ||
    norm.includes("daca investesc") ||
    norm.includes("ce-ar fi") ||
    norm.includes("ce ar fi") ||
    norm.includes("plus ") ||
    norm.includes("proiectie") ||
    norm.includes("simuleaza") ||
    /^\+?\s*\d+\s*lei/.test(norm);

  if (!isWhatIf) {
    return { matched: false, extraMonthlyBani: 0 };
  }

  const leiMatch = norm.match(/(\d+)\s*lei/);
  const extraLei = leiMatch ? parseInt(leiMatch[1], 10) : 200;
  const yearsMatch = norm.match(/(\d+)\s*ani/);
  const years = yearsMatch ? Math.max(1, Math.min(45, parseInt(yearsMatch[1], 10))) : undefined;

  return {
    matched: true,
    extraMonthlyBani: extraLei * 100,
    years,
  };
}

function isExplainNumberIntent(text: string): boolean {
  const norm = normalizeText(text);
  return (
    norm.includes("de unde vine") ||
    norm.includes("cum se calculeaza") ||
    norm.includes("cum ai calculat") ||
    norm.includes("cum ai ajuns") ||
    norm.includes("cifra") ||
    norm.includes("numarul") ||
    norm.includes("formula") ||
    norm.includes("decalaj") ||
    norm.includes("mai sus") ||
    norm.includes("anterior") ||
    /\b(326|209|74|135)\b/.test(norm)
  );
}

/**
 * Main agent execution pipeline.
 * Runs deterministic math tools first, then passes the exact numbers to Gemini/Groq (when configured)
 * so every response is genuinely generated by the AI grounded in exact deterministic figures!
 */
export async function runAgent(input: AgentRunInput): Promise<AgentRunOutput> {
  const ctx: UserFinancialContext = {
    ...DEFAULT_USER_CONTEXT,
    ...input.context,
    roundUpRule: {
      ...DEFAULT_USER_CONTEXT.roundUpRule,
      ...(input.context?.roundUpRule ?? {}),
    },
  };

  // 1. Handle Round-Up Rule (either "simulated" What-If OR "applied" Set/Change)
  const roundUpIntent =
    input.explicitAction?.type === "update_roundup" && input.explicitAction.roundUpRule
      ? {
          matched: true,
          mode: "applied" as const,
          rule: input.explicitAction.roundUpRule,
          sampleAmountBani: input.explicitAction.sampleAmountBani,
        }
      : input.explicitAction?.type === "simulate_roundup" && input.explicitAction.roundUpRule
        ? {
            matched: true,
            mode: "simulated" as const,
            rule: input.explicitAction.roundUpRule,
            sampleAmountBani: input.explicitAction.sampleAmountBani,
          }
        : parseRoundUpIntent(input.message);

  if (roundUpIntent.matched && roundUpIntent.rule) {
    const isSimulated = roundUpIntent.mode === "simulated";
    const updatedCtx: UserFinancialContext = isSimulated
      ? ctx
      : {
          ...ctx,
          roundUpRule: roundUpIntent.rule,
        };

    const toolResult = executeUpdateRoundUpRule(
      roundUpIntent.rule,
      ctx,
      roundUpIntent.sampleAmountBani,
      roundUpIntent.mode
    );
    const sources = searchKnowledge("pilonul 3 etf bet", 2);
    const sampleEx = toolResult.sampleTransactions[0];

    const fallbackResponseRo = isSimulated
      ? `**Simulare „Ce-ar fi dacă” (fără a-ți modifica setările active):**\nDacă regula ar deveni **${toolResult.ruleLabelRo}**, la o plată de ${sampleEx.spentFormatted} (*${sampleEx.label}*) ai plăti **${sampleEx.totalToPayFormatted}** (${sampleEx.roundUpFormatted} în pușculiță).\n\nLunar ai strânge **${toolResult.estimatedMonthlyRoundUpsFormatted}** din rotunjiri (total **${toolResult.newMonthlyTotalFormatted}/lună** față de **${toolResult.previousMonthlyTotalFormatted}/lună** acum), adică **+${toolResult.monthlyDaysAdded.base} zile de libertate/lună** (față de +${toolResult.previousMonthlyDaysBase} zile acum). Apasă butonul de mai jos dacă vrei să o activezi!`
      : `**Regulă aplicată în contul tău:** Am setat rotunjirea la **${toolResult.ruleLabelRo}**! Acum, la o plată precum *${sampleEx.label}* (${sampleEx.spentFormatted}), plătești **${sampleEx.totalToPayFormatted}**, iar **${sampleEx.roundUpFormatted}** merg în pușculiță.\n\nNoul tău borcan lunar este de **${toolResult.newMonthlyTotalFormatted}/lună** (${toolResult.estimatedMonthlyRoundUpsFormatted} rotunjiri + ${formatBaniToLei(ctx.paydaySavingBani)} din salariu), aducându-ți **+${toolResult.monthlyDaysAdded.base} zile de libertate/lună**.`;

    const llmResult = await generateNaturalLanguageExplanation({
      userMessage: input.message,
      deterministicFacts: [
        `- Tip acțiune: ${isSimulated ? "SIMULARE (nu a modificat încă setarea activă)" : "SETARE APLICATĂ ACTIV ÎN CONT"}`,
        `- Regulă nouă calculată de motorul matematic: ${toolResult.ruleLabelRo}`,
        `- Exemplu tranzacție 1 (${sampleEx.label}): preț ${sampleEx.spentFormatted} -> round-up ${sampleEx.roundUpFormatted} -> total plătit ${sampleEx.totalToPayFormatted}`,
        `- Exemplu tranzacție 2 (${toolResult.sampleTransactions[1]?.label}): preț ${toolResult.sampleTransactions[1]?.spentFormatted} -> round-up ${toolResult.sampleTransactions[1]?.roundUpFormatted} -> total plătit ${toolResult.sampleTransactions[1]?.totalToPayFormatted}`,
        `- Rotunjiri lunare estimate (~28 plăți): ${toolResult.estimatedMonthlyRoundUpsFormatted}/lună`,
        `- Economisire 3% salariu: ${formatBaniToLei(ctx.paydaySavingBani)}/lună`,
        `- Noul total lunar în borcan: ${toolResult.newMonthlyTotalFormatted}/lună (anterior: ${toolResult.previousMonthlyTotalFormatted}/lună)`,
        `- Zile de libertate câștigate lunar: +${toolResult.monthlyDaysAdded.base} zile/lună (interval ${toolResult.monthlyDaysAdded.pessimistic}–${toolResult.monthlyDaysAdded.optimistic} zile)`,
        `- Alocare pe produse (${describeRiskLevelRo(ctx.riskLevel)}): ${toolResult.allocation.summaryRo}`,
      ].join("\n"),
      fallbackResponseRo,
    });

    return {
      reply: llmResult.text,
      provider: llmResult.provider === "mock" ? "deterministic" : llmResult.provider,
      toolResult,
      sources,
      updatedContext: updatedCtx,
    };
  }

  // 2. Handle Risk Profile / Allocation (simulated vs applied)
  const riskIntent =
    input.explicitAction?.type === "change_risk" && input.explicitAction.riskLevel
      ? { risk: input.explicitAction.riskLevel, mode: "applied" as const }
      : parseRiskIntent(input.message);

  if (riskIntent) {
    const isSimulated = riskIntent.mode === "simulated";
    const updatedCtx: UserFinancialContext = isSimulated
      ? ctx
      : {
          ...ctx,
          riskLevel: riskIntent.risk,
        };
    const toolResult = executeChangeRiskAllocation(riskIntent.risk, ctx, riskIntent.mode);
    const sources = searchKnowledge(
      riskIntent.risk === "low" ? "titluri de stat" : riskIntent.risk === "high" ? "etf bet bvb" : "pilonul 3",
      2
    );

    const fallbackResponseRo = isSimulated
      ? `**Simulare profil ${toolResult.riskLabelRo}:** Dacă ai alege acest profil, cei **${toolResult.monthlyTotalFormatted}/lună** s-ar împărți în: **${toolResult.allocation.summaryRo}** (+${toolResult.monthlyDaysAdded.base} zile de libertate/lună).`
      : `**Profil actualizat în cont:** Am setat profilul tău pe **${toolResult.riskLabelRo}**. Cei **${toolResult.monthlyTotalFormatted}/lună** se împart acum în: **${toolResult.allocation.summaryRo}** (+${toolResult.monthlyDaysAdded.base} zile de libertate/lună).`;

    const llmResult = await generateNaturalLanguageExplanation({
      userMessage: input.message,
      deterministicFacts: [
        `- Tip acțiune: ${isSimulated ? "SIMULARE PROFIL RISC" : "PROFIL RISC APLICAT ÎN CONT"}`,
        `- Profil de risc: ${toolResult.riskLabelRo}`,
        `- Suma totală lunară alocată: ${toolResult.monthlyTotalFormatted}/lună`,
        `- Împărțire exactă pe produse: ${toolResult.allocation.summaryRo}`,
        `- Zile de libertate câștigate lunar: +${toolResult.monthlyDaysAdded.base} zile/lună`,
      ].join("\n"),
      fallbackResponseRo,
    });

    return {
      reply: llmResult.text,
      provider: llmResult.provider === "mock" ? "deterministic" : llmResult.provider,
      toolResult,
      sources,
      updatedContext: updatedCtx,
    };
  }

  // 3. Handle "What-If" Projection Simulation
  const whatIfIntent =
    input.explicitAction?.type === "what_if"
      ? {
          matched: true,
          extraMonthlyBani: input.explicitAction.extraMonthlyBani ?? 20000,
        }
      : parseWhatIfProjectionIntent(input.message);

  if (whatIfIntent.matched) {
    const toolResult = executeCalculateProjection(
      {
        extraMonthlyBani: whatIfIntent.extraMonthlyBani,
        years: whatIfIntent.years,
      },
      ctx
    );
    const sources = searchKnowledge("etf bet pilonul 3 randament", 2);

    const fallbackResponseRo =
      toolResult.extraMonthlyBani > 0
        ? `Dacă adaugi **+${toolResult.extraMonthlyFormatted}/lună** peste pușculița ta (ajungând la **${toolResult.monthlyContributionFormatted}/lună** investiți în profilul ${describeRiskLevelRo(ctx.riskLevel)}), pe un orizont de **${toolResult.years} ani** câștigi **+${toolResult.extraDaysGained.base} zile de libertate în plus**!\n\nÎn scenariul de bază (+4,5% randament real peste inflație), portofoliul tău ajunge la **${toolResult.projectedPortfolioFormatted.base}** (${toolResult.projectedDaysOfFreedom.base} zile de libertate, interval ${toolResult.projectedDaysOfFreedom.pessimistic}–${toolResult.projectedDaysOfFreedom.optimistic} zile).`
        : `La ritmul tău actual de **${toolResult.monthlyContributionFormatted}/lună**, peste **${toolResult.years} ani** (la vârsta de ${toolResult.retirementAge} ani) portofoliul tău este proiectat la **${toolResult.projectedPortfolioFormatted.base}** în scenariul de bază, oferindu-ți **${toolResult.projectedDaysOfFreedom.base} zile de libertate** (interval ${toolResult.projectedDaysOfFreedom.pessimistic}–${toolResult.projectedDaysOfFreedom.optimistic} zile).`;

    const llmResult = await generateNaturalLanguageExplanation({
      userMessage: input.message,
      deterministicFacts: [
        `- Orizont proiecție: ${toolResult.years} ani (de la ${toolResult.currentAge} la ${toolResult.retirementAge} ani)`,
        `- Sumă suplimentară adăugată: +${toolResult.extraMonthlyFormatted}/lună (Total lunar investit: ${toolResult.monthlyContributionFormatted}/lună)`,
        `- Portofoliu proiectat (Pesimist +1,5% real): ${toolResult.projectedPortfolioFormatted.pessimistic} (${toolResult.projectedDaysOfFreedom.pessimistic} zile de libertate)`,
        `- Portofoliu proiectat (Bază +4,5% real): ${toolResult.projectedPortfolioFormatted.base} (${toolResult.projectedDaysOfFreedom.base} zile de libertate)`,
        `- Portofoliu proiectat (Optimist +7,5% real): ${toolResult.projectedPortfolioFormatted.optimistic} (${toolResult.projectedDaysOfFreedom.optimistic} zile de libertate)`,
        `- Zile de libertate câștigate în plus față de traiectoria actuală: +${toolResult.extraDaysGained.base} zile`,
      ].join("\n"),
      fallbackResponseRo,
    });

    return {
      reply: llmResult.text,
      provider: llmResult.provider === "mock" ? "deterministic" : llmResult.provider,
      toolResult,
      sources,
      updatedContext: ctx,
    };
  }

  // 4. Handle Number / Formula Explanation (works for ANY number on screen OR from previous prompts!)
  if (isExplainNumberIntent(input.message)) {
    const toolResult = executeExplainNumber(ctx, input.message, input.lastToolResult);
    const sources = searchKnowledge("zile de libertate pensie de stat", 2);

    const fallbackResponseRo = `Iată explicația exactă pentru **${toolResult.targetNumberLabel}**:\n\n${toolResult.formulaSummaryRo}`;

    const llmResult = await generateNaturalLanguageExplanation({
      userMessage: input.message,
      deterministicFacts: [
        `- Cifra explicată: ${toolResult.targetNumberLabel}`,
        `- Formula deterministă: ${toolResult.formulaSummaryRo}`,
        ...toolResult.steps.map((s) => `- ${s.label} ${s.value}`),
      ].join("\n"),
      fallbackResponseRo,
    });

    return {
      reply: llmResult.text,
      provider: llmResult.provider === "mock" ? "deterministic" : llmResult.provider,
      toolResult,
      sources,
      updatedContext: ctx,
    };
  }

  // 5. Open-ended or Educational Query -> Call Gemini / Groq with conversation history + deterministic facts
  const sources = searchKnowledge(input.message, 2);
  const roundUpState = executeUpdateRoundUpRule(ctx.roundUpRule, ctx);
  const gap = executeExplainNumber(ctx, input.message, input.lastToolResult);
  const recentHistoryText = (input.history ?? [])
    .slice(-4)
    .map((h) => `${h.role === "user" ? "Utilizator" : "Agent"}: ${h.content}`)
    .join("\n");

  const deterministicFacts = [
    `- Utilizator: ${ctx.name}, ${ctx.age} ani, salariu net ${formatBaniToLei(ctx.salaryBani)}, Pilon II acumulat ${formatBaniToLei(ctx.pillarTwoBani)}.`,
    `- Zile de libertate actuale: ${gap.currentDays.base} zile (pesimist ${gap.currentDays.pessimistic}, optimist ${gap.currentDays.optimistic}). Decalaj zilnic la pensie: ${gap.dailyGapFormatted}/zi.`,
    `- Regulă activă de round-up: ${roundUpState.ruleLabelRo} -> generează ${roundUpState.estimatedMonthlyRoundUpsFormatted}/lună din rotunjiri + ${formatBaniToLei(ctx.paydaySavingBani)} (3% salariu) = ${roundUpState.newMonthlyTotalFormatted}/lună.`,
    `- Alocare lunară (${describeRiskLevelRo(ctx.riskLevel)}): ${roundUpState.allocation.summaryRo} (+${roundUpState.monthlyDaysAdded.base} zile de libertate/lună).`,
    recentHistoryText ? `- Istoric conversație recentă:\n${recentHistoryText}` : "",
    sources.length > 0
      ? `- Surse oficiale relevante: ${sources.map((s) => `${s.sourceTitle}: ${s.content}`).join(" | ")}`
      : "",
  ]
    .filter(Boolean)
    .join("\n");

  const normMsg = normalizeText(input.message);
  const isGreeting = /^(buna|salut|hello|hey|servus|neata)\b/.test(normMsg);

  const fallbackResponseRo = isGreeting
    ? `Salut, **${ctx.name}**! Sunt asistentul tău financiar din **Zile de Libertate**.\n\nÎn acest moment ai **${gap.currentDays.base} zile de libertate** și strângi **${roundUpState.newMonthlyTotalFormatted}/lună** (${roundUpState.ruleLabelRo}). Poți să mă întrebi orice despre investiții sau să îmi ceri să simulăm / setăm o nouă regulă de rotunjire!`
    : sources[0]?.content
      ? `${sources[0].content}\n\nÎn contul tău actual (${describeRiskLevelRo(ctx.riskLevel)}, ${roundUpState.ruleLabelRo}), strângi **${roundUpState.newMonthlyTotalFormatted}/lună**, ceea ce îți adaugă **+${roundUpState.monthlyDaysAdded.base} zile de libertate/lună**.`
      : `Pentru a răspunde la întrebări deschise precum *„${input.message}”*, verifică conexiunea la cheia Google AI Studio (\`GOOGLE_GENERATIVE_AI_API_KEY\` în \`.env.local\`). În contul tău actual strângi **${roundUpState.newMonthlyTotalFormatted}/lună** (+${roundUpState.monthlyDaysAdded.base} zile de libertate/lună).`;

  const llmResult = await generateNaturalLanguageExplanation({
    userMessage: input.message,
    deterministicFacts,
    fallbackResponseRo,
  });

  return {
    reply: llmResult.text,
    provider: llmResult.provider === "mock" ? "deterministic" : llmResult.provider,
    sources,
    updatedContext: ctx,
  };
}

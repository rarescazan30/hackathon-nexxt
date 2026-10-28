// AI Model Provider Switch (gemini | groq | mock).
// Uses Google AI Studio (gemini-3.5-flash-lite / gemini-3.8-flash) with a 25s timeout
// so real LLM thinking responses complete cleanly without being prematurely aborted.

import { AGENT_SYSTEM_PROMPT } from "./prompt";

export type AiProvider = "gemini" | "groq" | "mock";

function cleanEnvKey(raw?: string): string {
  return (raw || "").trim().replace(/^["']|["']$/g, "");
}

export function getActiveAiProvider(): AiProvider {
  const envProvider = (process.env.AI_PROVIDER || "").toLowerCase().trim();
  const hasGeminiKey = Boolean(
    cleanEnvKey(process.env.GOOGLE_GENERATIVE_AI_API_KEY) ||
      cleanEnvKey(process.env.GEMINI_API_KEY)
  );
  const hasGroqKey = Boolean(cleanEnvKey(process.env.GROQ_API_KEY));

  if (envProvider === "gemini" && hasGeminiKey) return "gemini";
  if (envProvider === "groq" && hasGroqKey) return "groq";
  if (envProvider === "mock") return "mock";

  if (hasGeminiKey) return "gemini";
  if (hasGroqKey) return "groq";
  return "mock";
}

// Verified working models on Google AI Studio for this account:
// gemini-3.5-flash-lite (~8s) and gemini-3.8-flash (~10s)
const GEMINI_MODELS = ["gemini-3.5-flash-lite", "gemini-3.8-flash"];

/**
 * Calls Google AI Studio (Gemini) or Groq to generate a genuine LLM response,
 * grounded in the user's deterministic financial context from lib/rules.
 */
export async function generateNaturalLanguageExplanation(options: {
  userMessage: string;
  deterministicFacts: string;
  fallbackResponseRo: string;
}): Promise<{ text: string; provider: AiProvider }> {
  const provider = getActiveAiProvider();

  if (provider === "mock") {
    return { text: options.fallbackResponseRo, provider: "mock" };
  }

  const prompt = `${AGENT_SYSTEM_PROMPT}

CONTEXT FINANCIAR DETERMINIST AL UTILIZATORULUI (folosește aceste cifre când sunt relevante pentru întrebare):
${options.deterministicFacts}

MESAJUL UTILIZATORULUI:
"${options.userMessage}"

Instrucțiuni:
- Răspunde în limba română, clar, prietenos și direct la subiectul întrebat de utilizator.
- Dacă utilizatorul întreabă un concept financiar general (ex: „Ce e o obligațiune?”, „Ce e inflația?”, „Ce e un depozit?”, „Care e diferența dintre X și Y?”), explică acel concept clar și pe înțelesul tuturor, fără să deviezi la ETF-uri dacă nu a întrebat de ETF-uri.
- Dacă întrebarea este legată de cifrele sau setările lui din aplicație, folosește exact cifrele din CONTEXT FINANCIAR DETERMINIST.
- Folosește **bold** pentru ideile sau cifrele importante. Fii concis (2-3 paragrafe scurte).`;

  try {
    if (provider === "gemini") {
      const apiKey =
        cleanEnvKey(process.env.GOOGLE_GENERATIVE_AI_API_KEY) ||
        cleanEnvKey(process.env.GEMINI_API_KEY);
      if (!apiKey) {
        return { text: options.fallbackResponseRo, provider: "mock" };
      }

      for (const modelName of GEMINI_MODELS) {
        try {
          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              signal: AbortSignal.timeout(25000),
              body: JSON.stringify({
                contents: [{ role: "user", parts: [{ text: prompt }] }],
                generationConfig: {
                  temperature: 0.35,
                  maxOutputTokens: 1200,
                },
              }),
            }
          );

          if (!response.ok) {
            continue;
          }

          const data = (await response.json()) as {
            candidates?: Array<{
              content?: {
                parts?: Array<{ text?: string; thought?: boolean }>;
              };
            }>;
          };

          const parts = data.candidates?.[0]?.content?.parts ?? [];
          const nonThoughtParts = parts.filter((p) => !p.thought && p.text);
          const text = (
            nonThoughtParts.length > 0
              ? nonThoughtParts.map((p) => p.text).join("\n")
              : parts.map((p) => p.text ?? "").join("\n")
          ).trim();

          if (text) {
            return { text, provider: "gemini" };
          }
        } catch {
          continue;
        }
      }
    }

    if (provider === "groq") {
      const apiKey = cleanEnvKey(process.env.GROQ_API_KEY);
      if (!apiKey) {
        return { text: options.fallbackResponseRo, provider: "mock" };
      }

      const response = await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          signal: AbortSignal.timeout(20000),
          body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            temperature: 0.35,
            max_tokens: 600,
            messages: [
              { role: "system", content: AGENT_SYSTEM_PROMPT },
              {
                role: "user",
                content: `CONTEXT FINANCIAR:\n${options.deterministicFacts}\n\nMESAJ UTILIZATOR: ${options.userMessage}`,
              },
            ],
          }),
        }
      );

      if (response.ok) {
        const data = (await response.json()) as {
          choices?: Array<{ message?: { content?: string } }>;
        };
        const text = data.choices?.[0]?.message?.content?.trim();
        if (text) {
          return { text, provider: "groq" };
        }
      }
    }
  } catch {
    // Fallback if offline
  }

  return { text: options.fallbackResponseRo, provider: "mock" };
}

// AI model provider switch (gemini | groq | mock) and one function to call it.
// Every caller passes a fallback, so the app works with AI_PROVIDER=mock and no keys.

export type AiProvider = "gemini" | "groq" | "mock";

// Verified working models on Google AI Studio for this account (fastest first).
const GEMINI_MODELS = ["gemini-3.5-flash-lite", "gemini-3.8-flash"];
const GROQ_MODEL = "llama-3.3-70b-versatile";
const TIMEOUT_MS = 25_000;

function cleanEnvKey(raw?: string): string {
  return (raw || "").trim().replace(/^["']|["']$/g, "");
}

function geminiKey() {
  return cleanEnvKey(process.env.GOOGLE_GENERATIVE_AI_API_KEY) || cleanEnvKey(process.env.GEMINI_API_KEY);
}

export function getActiveAiProvider(): AiProvider {
  const envProvider = (process.env.AI_PROVIDER || "").toLowerCase().trim();
  const hasGeminiKey = Boolean(geminiKey());
  const hasGroqKey = Boolean(cleanEnvKey(process.env.GROQ_API_KEY));

  if (envProvider === "gemini" && hasGeminiKey) return "gemini";
  if (envProvider === "groq" && hasGroqKey) return "groq";
  if (envProvider === "mock") return "mock";

  if (hasGeminiKey) return "gemini";
  if (hasGroqKey) return "groq";
  return "mock";
}

export interface ModelRequest {
  system: string;
  prompt: string;
  /** A PDF to read (Gemini only). */
  pdfBase64?: string;
  /** Ask for a JSON answer. */
  json?: boolean;
  /** Longer answers, e.g. a list of transactions (default 800 tokens). */
  maxOutputTokens?: number;
}

/**
 * Sends one request to the active provider. Returns null on mock, on errors, or when the
 * provider can't handle the request (Groq can't read PDFs): callers then use their fallback.
 */
export async function callModel(request: ModelRequest): Promise<{ text: string; provider: AiProvider } | null> {
  const provider = getActiveAiProvider();
  try {
    if (provider === "gemini") return await callGemini(request);
    if (provider === "groq" && !request.pdfBase64) return await callGroq(request);
  } catch {
    // Offline, timeout or a bad response: fall through to the caller's fallback.
  }
  return null;
}

async function callGemini({ system, prompt, pdfBase64, json, maxOutputTokens = 800 }: ModelRequest) {
  const parts: object[] = [{ text: prompt }];
  if (pdfBase64) parts.push({ inlineData: { mimeType: "application/pdf", data: pdfBase64 } });

  for (const model of GEMINI_MODELS) {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey()}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: AbortSignal.timeout(TIMEOUT_MS),
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: system }] },
          contents: [{ role: "user", parts }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens,
            ...(json ? { responseMimeType: "application/json" } : {}),
          },
        }),
      }
    );
    if (!response.ok) {
      // Shows up in the server log, e.g. 401 = the key in .env.local is wrong.
      console.warn(`Gemini ${model}: HTTP ${response.status}`);
      continue;
    }

    const data = (await response.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string; thought?: boolean }> } }>;
    };
    const answer = (data.candidates?.[0]?.content?.parts ?? [])
      .filter((part) => !part.thought && part.text)
      .map((part) => part.text)
      .join("\n")
      .trim();
    if (answer) return { text: answer, provider: "gemini" as const };
  }
  return null;
}

async function callGroq({ system, prompt, json }: ModelRequest) {
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${cleanEnvKey(process.env.GROQ_API_KEY)}` },
    signal: AbortSignal.timeout(TIMEOUT_MS),
    body: JSON.stringify({
      model: GROQ_MODEL,
      temperature: 0.3,
      max_tokens: 600,
      ...(json ? { response_format: { type: "json_object" } } : {}),
      messages: [
        { role: "system", content: system },
        { role: "user", content: prompt },
      ],
    }),
  });
  if (!response.ok) return null;
  const data = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const answer = data.choices?.[0]?.message?.content?.trim();
  return answer ? { text: answer, provider: "groq" as const } : null;
}

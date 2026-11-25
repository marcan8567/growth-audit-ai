import "server-only"; // build fails if this file is ever imported into browser code
import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import { getClient, getModel } from "./client";

/**
 * One function that sends a conversation to whichever AI provider is configured
 * and returns plain text. Everything above this (JSON parsing, Zod validation,
 * the retry, the grounding check) is the same for every provider.
 *
 * Choose the provider with AI_PROVIDER=anthropic (default) or AI_PROVIDER=gemini.
 *
 * Each step also picks a tier, to balance cost and quality:
 * - "fast": a cheap model for steps that summarise or plan (brand voice, automation plan)
 * - "smart": a stronger model, with thinking kept low, for what the reader judges the report by
 *   (the growth audit and the social media post)
 */

export type Tier = "fast" | "smart";

export type Provider = "anthropic" | "gemini";

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

export interface CompletionRequest {
  /** Step name, used in the usage log. */
  label?: string;
  tier: Tier;
  system: string;
  messages: ChatTurn[];
  maxTokens: number;
}

export interface CompletionResult {
  text: string;
  /** True when the answer stopped because it hit the token limit. */
  truncated: boolean;
}

export function getProvider(): Provider {
  const value = (process.env.AI_PROVIDER || "anthropic").toLowerCase();
  if (value === "anthropic" || value === "gemini") return value;
  throw new Error(`AI_PROVIDER must be "anthropic" or "gemini" (got "${value}").`);
}

// Current Claude and Gemini models "think" before answering, and those thinking tokens
// count towards the output limit, so the limit is raised to leave room for the actual JSON.
// You only pay for tokens actually used, so a higher limit costs nothing by itself.
const THINKING_HEADROOM = 6_000;

export async function complete(request: CompletionRequest): Promise<CompletionResult> {
  const call = () => (getProvider() === "gemini" ? completeWithGemini(request) : completeWithAnthropic(request));
  // AI providers are sometimes briefly overloaded or rate-limited. Those errors pass within seconds,
  // so they get two more tries with a short pause; any other error fails straight away.
  for (let attempt = 1; ; attempt++) {
    try {
      return await call();
    } catch (err) {
      if (attempt >= 3 || !isTemporary(err)) throw err;
      console.warn(`[${request.label ?? "AI call"}] temporary provider error, retrying (${attempt}/2):`, err instanceof Error ? err.message : err);
      await new Promise((resolve) => setTimeout(resolve, attempt * 2_000));
    }
  }
}

/** Overloaded, rate-limited, server or network errors: worth trying again. Bad requests or keys are not. */
function isTemporary(err: unknown): boolean {
  const status = (err as { status?: number })?.status;
  if (typeof status === "number") return status === 408 || status === 429 || status >= 500;
  const message = err instanceof Error ? err.message : String(err);
  return /(408|429|500|502|503|504|529)|overloaded|unavailable|resource.?exhausted|deadline|timed? ?out|fetch failed|ECONNRESET|socket hang up/i.test(message);
}

async function completeWithAnthropic({ label, system, messages, maxTokens }: CompletionRequest): Promise<CompletionResult> {
  const response = await getClient().messages.create({
    model: getModel(),
    max_tokens: maxTokens + THINKING_HEADROOM,
    system,
    messages,
  });
  console.info(`[usage] ${label ?? "AI call"}: input ${response.usage.input_tokens}, output ${response.usage.output_tokens}`);
  return {
    text: response.content.map((block) => (block.type === "text" ? block.text : "")).join(""),
    truncated: response.stop_reason === "max_tokens",
  };
}

let gemini: GoogleGenAI | null = null;

async function completeWithGemini({ label, tier, system, messages, maxTokens }: CompletionRequest): Promise<CompletionResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set. Add it to .env.local (or to Vercel's environment variables).");
  gemini ??= new GoogleGenAI({ apiKey });

  const response = await gemini.models.generateContent({
    model: geminiModel(tier),
    // Gemini calls the assistant role "model".
    contents: messages.map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] })),
    config: {
      systemInstruction: system,
      maxOutputTokens: maxTokens + THINKING_HEADROOM,
      responseMimeType: "application/json", // asks Gemini for raw JSON, no code fences
      // Thinking is billed as output and was most of the cost; "low" kept the quality in testing.
      ...(tier === "smart" ? { thinkingConfig: { thinkingLevel: ThinkingLevel.LOW } } : {}),
    },
  });

  // Token counts per call, for cost tracking (Vercel → Logs). Thinking tokens are billed as output.
  const u = response.usageMetadata;
  console.info(
    `[usage] ${label ?? "AI call"} (${geminiModel(tier)}): input ${u?.promptTokenCount ?? "?"}, output ${u?.candidatesTokenCount ?? "?"}, thinking ${u?.thoughtsTokenCount ?? 0}, cached ${u?.cachedContentTokenCount ?? 0}`,
  );

  return {
    text: response.text ?? "",
    truncated: response.candidates?.[0]?.finishReason === "MAX_TOKENS",
  };
}

/** Gemini model per tier. Both can be changed in the environment without touching code. */
function geminiModel(tier: Tier): string {
  return tier === "fast"
    ? process.env.GEMINI_MODEL_FAST || "gemini-3.1-flash-lite"
    : process.env.GEMINI_MODEL || "gemini-3.8-flash";
}

import "server-only"; // build fails if this file is ever imported into browser code
import { GoogleGenAI } from "@google/genai";
import { getClient, getModel } from "./client";

/**
 * One function that sends a conversation to whichever AI provider is configured
 * and returns plain text. Everything above this (JSON parsing, Zod validation,
 * the retry, the grounding check) is the same for every provider.
 *
 * Choose the provider with AI_PROVIDER=anthropic (default) or AI_PROVIDER=gemini.
 */

export type Provider = "anthropic" | "gemini";

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

export interface CompletionRequest {
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

export async function complete(request: CompletionRequest): Promise<CompletionResult> {
  return getProvider() === "gemini" ? completeWithGemini(request) : completeWithAnthropic(request);
}

async function completeWithAnthropic({ system, messages, maxTokens }: CompletionRequest): Promise<CompletionResult> {
  const response = await getClient().messages.create({
    model: getModel(),
    max_tokens: maxTokens,
    system,
    messages,
  });
  return {
    text: response.content.map((block) => (block.type === "text" ? block.text : "")).join(""),
    truncated: response.stop_reason === "max_tokens",
  };
}

// Gemini models "think" before answering, and those thinking tokens count towards
// the output limit, so the limit is raised to leave room for the actual JSON.
const GEMINI_THINKING_HEADROOM = 6_000;

let gemini: GoogleGenAI | null = null;

async function completeWithGemini({ system, messages, maxTokens }: CompletionRequest): Promise<CompletionResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set. Add it to .env.local (or to Vercel's environment variables).");
  gemini ??= new GoogleGenAI({ apiKey });

  const response = await gemini.models.generateContent({
    model: process.env.GEMINI_MODEL || "gemini-3.8-flash",
    // Gemini calls the assistant role "model".
    contents: messages.map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] })),
    config: {
      systemInstruction: system,
      maxOutputTokens: maxTokens + GEMINI_THINKING_HEADROOM,
      responseMimeType: "application/json", // asks Gemini for raw JSON, no code fences
    },
  });

  return {
    text: response.text ?? "",
    truncated: response.candidates?.[0]?.finishReason === "MAX_TOKENS",
  };
}

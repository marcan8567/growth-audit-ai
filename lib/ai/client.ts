import "server-only"; // build fails if this file is ever imported into browser code
import Anthropic from "@anthropic-ai/sdk";

let client: Anthropic | null = null;

export function getClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set. Add it to .env.local (or to Vercel's environment variables).");
  client ??= new Anthropic({ apiKey, maxRetries: 2 });
  return client;
}

export function getModel(): string {
  return process.env.ANTHROPIC_MODEL || "claude-haiku-5-5";
}

import "server-only";
import type { z } from "zod";
import { complete, type ChatTurn, type Tier } from "./complete";

interface StepOptions<T> {
  name: string;
  system: string;
  user: string;
  schema: z.ZodType<T>;
  maxTokens?: number;
  /** "fast" (cheap model) or "smart" (stronger model); see complete.ts. */
  tier: Tier;
}

/**
 * Runs one AI step and guarantees the result matches its Zod schema.
 *
 * 1. Ask the AI (Claude or Gemini, see complete.ts) for JSON.
 * 2. Parse it and validate it against the schema.
 * 3. If it fails, show the AI the exact problem and ask once more.
 * 4. If it fails again, throw a clear error instead of passing bad data on.
 */
export async function runJsonStep<T>({ name, system, user, schema, tier, maxTokens = 3_000 }: StepOptions<T>): Promise<T> {
  const messages: ChatTurn[] = [{ role: "user", content: user }];

  for (let attempt = 1; attempt <= 2; attempt++) {
    const { text, truncated } = await complete({ label: attempt === 1 ? name : `${name} (retry)`, tier, system, messages, maxTokens });
    const parsed = parseJson(text);
    const checked = parsed.ok ? schema.safeParse(parsed.value) : null;
    if (checked?.success) return checked.data;

    const problem = !parsed.ok
      ? parsed.error
      : checked && !checked.success
        ? checked.error.issues
            .slice(0, 6)
            .map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`)
            .join("; ")
        : "unknown problem";

    if (truncated && attempt === 2) {
      throw new Error(`${name}: the answer was cut off because it was too long.`);
    }
    if (attempt === 2) throw new Error(`${name}: the AI output failed validation twice. Last problem: ${problem}`);

    // Logged so retries show up in the server logs (Vercel → Logs) and can be used to improve the prompts.
    console.warn(`[${name}] attempt 1 failed validation, retrying. Problem: ${problem}`);

    messages.push(
      { role: "assistant", content: text || "(empty)" },
      {
        role: "user",
        content: `That response was not valid. Problem: ${problem}\nReply again with ONLY the corrected JSON object, nothing else.`,
      },
    );
  }

  throw new Error(`${name}: unreachable`);
}

/** Models sometimes wrap JSON in code fences or add a sentence; keep only the JSON object. */
function parseJson(text: string): { ok: true; value: unknown } | { ok: false; error: string } {
  const unfenced = text.replace(/```(?:json)?/gi, "").trim();
  const start = unfenced.indexOf("{");
  const end = unfenced.lastIndexOf("}");
  if (start === -1 || end <= start) return { ok: false, error: "no JSON object found in the response" };
  try {
    return { ok: true, value: JSON.parse(unfenced.slice(start, end + 1)) };
  } catch (err) {
    return { ok: false, error: `invalid JSON (${err instanceof Error ? err.message : "parse error"})` };
  }
}

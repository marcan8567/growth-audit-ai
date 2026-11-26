import { z } from "zod";

/** LinkedIn's limit for a connection request note. */
export const CONNECTION_NOTE_LIMIT = 300;
export const FOLLOW_UP_LIMIT = 800;
export const EMAIL_LIMIT = 1_100;

const OPENER_STYLES = ["curiosity", "number", "compliment"] as const;

/** All numbers written in a text ("47", "2.5", "300"), for the grounding check. Web addresses are ignored (report links contain digits). */
export function numbersIn(text: string): string[] {
  const withoutAddresses = text.replace(/https?:\/\/\S+|\b[\w-]+\.(?:com|app|io|ai|net|org|es|de|co|uk|dev)\S*/gi, " ");
  return (withoutAddresses.match(/\d+(?:[.,]\d+)?/g) ?? []).map((n) => n.replace(",", "."));
}

/**
 * The outreach messages. Built per request, because the number check needs the report:
 * every number the AI writes must appear in the report digest, so it can't invent results
 * ("40% more leads") or misquote a score.
 */
export function outreachSchema(allowedNumbers: Set<string>) {
  const groundedText = (max: number, min = 20) =>
    z
      .string()
      .trim()
      .min(min)
      .max(max)
      .superRefine((text, ctx) => {
        const invented = numbersIn(text).filter((n) => !allowedNumbers.has(n));
        if (invented.length) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `uses numbers that are not in the report (${[...new Set(invented)].join(", ")}). Only use numbers from the report, or none.`,
          });
        }
      });

  return z.object({
    findings: z.array(z.string().trim().min(5).max(160)).length(3),
    connectionNote: groundedText(CONNECTION_NOTE_LIMIT),
    followUp: groundedText(FOLLOW_UP_LIMIT),
    email: z.object({ subject: groundedText(90, 5), body: groundedText(EMAIL_LIMIT) }),
    openers: z
      .array(z.object({ style: z.enum(OPENER_STYLES), subject: groundedText(90, 5), firstLine: groundedText(220) }))
      .length(3),
  });
}

export type OutreachKit = z.infer<ReturnType<typeof outreachSchema>>;

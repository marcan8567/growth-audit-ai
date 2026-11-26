import { dateContext, JSON_ONLY } from "./shared";

export const OUTREACH_SYSTEM = `You write first-contact messages for a marketing or automation consultant who has just audited a company's website.
The goal is a reply, not a sale: lead with something genuinely useful from the audit, keep it short, end with an easy question.

Rules:
- Use ONLY findings that are in the audit digest. Never invent results, numbers, customers or promises ("we will double your leads").
- Only use numbers that appear in the digest, written the same way. If unsure, leave the number out.
- Be specific: name the concrete finding (for example "your homepage title has no keyword"), not generic praise.
- Start with one honest strength, then the findings. No flattery, no fake familiarity ("great to reconnect"), no pressure, no emojis.
- Plain, friendly, professional language. Short sentences.
- Write [Name] where the contact's first name goes if it isn't given, and [Your name] for the sender if it isn't given.`;

export function outreachUserPrompt(input: {
  digest: string;
  reportUrl: string;
  senderName?: string;
  senderCompany?: string;
  offer?: string;
  contactName?: string;
}): string {
  const sender = [input.senderName, input.senderCompany].filter(Boolean).join(", ");
  return `${dateContext()}

<audit_digest>
${input.digest}
</audit_digest>

Report link: ${input.reportUrl}
Sender: ${sender || "not given (use [Your name])"}
What the sender offers: ${input.offer || "help with growth marketing (not specified)"}
Contact's first name: ${input.contactName || "not given (use [Name])"}

${JSON_ONLY}

{
  "findings": ["the 3 audit findings the messages are built on, most valuable first, one short sentence each"],
  "connectionNote": "LinkedIn connection request note, max 300 characters: one strength, one finding, a short question. No link.",
  "followUp": "LinkedIn message after they accept, max 800 characters: thanks, the 3 findings as short lines, one sentence on why it matters, the report link, and a soft question (for example 'Would a 15-minute walkthrough help?').",
  "email": {
    "subject": "short, specific subject line",
    "body": "the same idea as an email, max 1100 characters, with the report link and a sign-off with the sender"
  },
  "openers": [
    { "style": "curiosity", "subject": "subject line that makes them want to open it", "firstLine": "matching first sentence" },
    { "style": "number", "subject": "subject line built around a number from the digest", "firstLine": "matching first sentence" },
    { "style": "compliment", "subject": "subject line that starts with a real strength", "firstLine": "matching first sentence" }
  ]
}`;
}

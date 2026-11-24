import { GROUNDING_RULES, JSON_ONLY } from "./shared";

export const AUTOMATION_PLAN_SYSTEM = `You are a marketing operations and AI automation consultant.
You recommend practical automations a small marketing team could set up within a few weeks, using common tools.

${GROUNDING_RULES}
- Base each automation on something the website actually shows (its offer, its calls to action, its content, its channels).
- Name real, widely used tool categories or products (for example HubSpot, Zapier, Make, n8n, Google Sheets, Slack, an LLM API) and explain what AI does in the workflow, if anything.`;

export function automationPlanUserPrompt(websiteContent: string, checks: string): string {
  return `Recommend marketing automations for this company.

<website>
${websiteContent}
</website>

<automated_checks>
${checks}
</automated_checks>

${JSON_ONLY}

{
  "summary": "2 sentences: where automation would help this company's marketing most",
  "automations": [
    {
      "name": "short name",
      "goal": "the business result it supports",
      "trigger": "what starts it (for example: a demo form is submitted)",
      "steps": ["2 to 6 steps, in order"],
      "tools": ["1 to 4 tools"],
      "aiRole": "what AI does in this workflow, or null if it needs no AI",
      "metric": "how to measure success",
      "effort": "low | medium | high",
      "impact": "low | medium | high"
    }
  ]
}

Give exactly 3 automations: the three most valuable for this company, most valuable first.`;
}

import "server-only";
import { runJsonStep } from "@/lib/ai/run-step";
import { formatChecksForPrompt, type SiteCheck } from "@/lib/reader/checks";
import { formatWebsiteForPrompt } from "@/lib/reader/format";
import type { WebsiteData } from "@/lib/reader/types";
import { AutomationPlanSchema, type AutomationPlan } from "@/lib/schemas/automation-plan";
import { AUTOMATION_PLAN_SYSTEM, automationPlanUserPrompt } from "@/prompts/automation-plan";

/** Automation plan: practical marketing automations based on what the website shows. */
export async function runAutomationPlan(site: WebsiteData, checks: SiteCheck[]): Promise<AutomationPlan> {
  return runJsonStep({
    name: "Automation plan",
    system: AUTOMATION_PLAN_SYSTEM,
    user: automationPlanUserPrompt(formatWebsiteForPrompt(site), formatChecksForPrompt(checks)),
    schema: AutomationPlanSchema,
    maxTokens: 3_500,
  });
}

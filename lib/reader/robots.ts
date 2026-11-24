/**
 * robots.txt: a website's instructions for automated tools. We follow them, so a site that asks
 * not to be read isn't audited, and pages it excludes are skipped.
 *
 * Rules for "GrowthAuditAI" apply if present, otherwise the rules for "*". The most specific
 * (longest) matching rule wins, and Allow beats Disallow on a tie, as in Google's interpretation.
 * If robots.txt is missing or can't be read, everything is allowed (the standard behaviour).
 */

const OUR_AGENT = "growthauditai";

type Rule = { allow: boolean; path: string };

export interface Robots {
  isAllowed(path: string): boolean;
}

const ALLOW_ALL: Robots = { isAllowed: () => true };

export async function loadRobots(origin: string): Promise<Robots> {
  try {
    const res = await fetch(`${origin}/robots.txt`, {
      redirect: "follow",
      signal: AbortSignal.timeout(3_000),
      headers: { "User-Agent": "Mozilla/5.0 (compatible; GrowthAuditAI/0.1)" },
    });
    if (!res.ok) return ALLOW_ALL;
    return parseRobots((await res.text()).slice(0, 200_000));
  } catch {
    return ALLOW_ALL;
  }
}

export function parseRobots(text: string): Robots {
  const groups: { agents: string[]; rules: Rule[] }[] = [];
  let current: { agents: string[]; rules: Rule[] } | null = null;

  for (const raw of text.split(/\r?\n/)) {
    const line = raw.replace(/#.*$/, "").trim();
    const match = line.match(/^([A-Za-z-]+)\s*:\s*(.*)$/);
    if (!match) continue;
    const field = match[1].toLowerCase();
    const value = match[2].trim();

    if (field === "user-agent") {
      // Consecutive User-agent lines share the rules that follow them.
      if (!current || current.rules.length) {
        current = { agents: [], rules: [] };
        groups.push(current);
      }
      current.agents.push(value.toLowerCase());
    } else if ((field === "allow" || field === "disallow") && current) {
      if (field === "disallow" && value === "") continue; // "Disallow:" with nothing means allow all
      current.rules.push({ allow: field === "allow", path: value });
    }
  }

  const ours = groups.filter((g) => g.agents.some((a) => a !== "*" && OUR_AGENT.includes(a.replace(/\/.*$/, ""))));
  const chosen = ours.length ? ours : groups.filter((g) => g.agents.includes("*"));
  const rules = chosen.flatMap((g) => g.rules);
  if (!rules.length) return ALLOW_ALL;

  return {
    isAllowed(path: string) {
      let best: Rule | null = null;
      for (const rule of rules) {
        if (!matches(rule.path, path)) continue;
        if (!best || rule.path.length > best.path.length || (rule.path.length === best.path.length && rule.allow)) best = rule;
      }
      return best ? best.allow : true;
    },
  };
}

/** robots.txt patterns: "*" matches anything, "$" anchors the end. */
function matches(pattern: string, path: string): boolean {
  const regex = new RegExp(
    "^" +
      pattern
        .split("")
        .map((ch) => (ch === "*" ? ".*" : ch === "$" ? "$" : ch.replace(/[.+?^{}()|[\]\\]/g, "\\$&")))
        .join(""),
  );
  return regex.test(path);
}

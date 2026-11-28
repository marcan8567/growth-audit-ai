import { z } from "zod";

/** New reports get one LinkedIn post and one X post. (Older reports may hold other platforms; the preview still shows them.) */
export const PLATFORMS = ["LinkedIn", "X"] as const;
export const FORMATS = ["Text post", "Image"] as const;

/** Formats that need a designed visual (shown as a branded image). */
export const VISUAL_FORMATS: readonly string[] = ["Image"];

/** X counts every character; a post has to fit in one. */
export const X_LIMIT = 280;
/** Short on purpose: a LinkedIn post that is read in full, not cut off after "see more". */
export const LINKEDIN_LIMIT = 600;

/** The whole text as it is posted, used for the length rules. */
export const postLength = (post: { hook: string; body: string; cta: string; hashtags: string[] }) =>
  [post.hook, post.body, post.cta, post.hashtags.map((h) => `#${h}`).join(" ")].filter(Boolean).join("\n\n").length;

/**
 * The free content sample: two ready-to-post social media posts (LinkedIn, then X), plus the three
 * themes a full content plan would build on (used in the "want the full plan?" call to action).
 */
const ContentPackObject = z
  .object({
    strategy: z.string().min(1),
    pillars: z
      .array(z.object({ name: z.string().min(1), why: z.string().min(1) }))
      .length(3),
    posts: z
      .array(
        z.object({
          platform: z.enum(PLATFORMS),
          format: z.enum(FORMATS),
          pillar: z.string().min(1),
          hook: z.string().min(1).max(140),
          body: z.string().min(1).max(450),
          cta: z.string().min(1).max(120),
          hashtags: z.array(z.string().min(1)).max(3),
          visualText: z.string().max(70).nullable(),
        }),
      )
      .length(2),
  })
  .superRefine((pack, ctx) => {
    const issue = (path: (string | number)[], message: string) =>
      ctx.addIssue({ code: z.ZodIssueCode.custom, path, message });

    if (pack.posts[0]?.platform !== "LinkedIn" || pack.posts[1]?.platform !== "X") {
      issue(["posts"], 'give exactly two posts: the first for "LinkedIn", the second for "X"');
    }
    if (pack.posts[0] && pack.posts[1] && pack.posts[0].hook === pack.posts[1].hook) {
      issue(["posts", 1, "hook"], "the X post must take a different angle from the LinkedIn post, not repeat its hook");
    }

    const pillarNames = new Set(pack.pillars.map((p) => p.name));
    pack.posts.forEach((post, i) => {
      if (!pillarNames.has(post.pillar)) {
        issue(["posts", i, "pillar"], `"${post.pillar}" is not one of the theme names; use a theme name exactly as written`);
      }
      if (VISUAL_FORMATS.includes(post.format) && !post.visualText) {
        issue(["posts", i, "visualText"], `an "${post.format}" post needs visualText: the short headline shown on the image`);
      }
      const length = postLength(post);
      const limit = post.platform === "X" ? X_LIMIT : LINKEDIN_LIMIT;
      if (length > limit) {
        issue(
          ["posts", i, "body"],
          `the ${post.platform} post must be at most ${limit} characters including hook, cta and hashtags; this one is ${length}. Shorten it`,
        );
      }
    });
  });

/**
 * A post that is only slightly too long (usually a few characters on X) loses hashtags until it fits,
 * instead of costing a whole retry. Anything still too long after that goes back to the AI as before.
 */
function dropHashtagsToFit(input: unknown): unknown {
  if (!input || typeof input !== "object" || !Array.isArray((input as { posts?: unknown }).posts)) return input;
  const pack = input as { posts: Record<string, unknown>[] };
  return {
    ...pack,
    posts: pack.posts.map((post) => {
      if (!post || typeof post !== "object" || !Array.isArray(post.hashtags)) return post;
      const limit = post.platform === "X" ? X_LIMIT : LINKEDIN_LIMIT;
      const hashtags = [...(post.hashtags as string[])];
      const length = () => postLength({ hook: String(post.hook ?? ""), body: String(post.body ?? ""), cta: String(post.cta ?? ""), hashtags });
      while (hashtags.length && length() > limit) hashtags.pop();
      return { ...post, hashtags };
    }),
  };
}

export const ContentPackSchema = z.preprocess(dropHashtagsToFit, ContentPackObject);

export type ContentPack = z.infer<typeof ContentPackSchema>;

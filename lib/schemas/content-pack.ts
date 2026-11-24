import { z } from "zod";

/** Platforms the post can be written for. The report shows each one styled like that platform's feed. */
export const PLATFORMS = ["LinkedIn", "X", "Instagram", "Facebook"] as const;
export const FORMATS = ["Text post", "Image", "Carousel", "Short video"] as const;

/** Formats that need a designed visual (shown as a branded image, slide or video frame). */
export const VISUAL_FORMATS: readonly string[] = ["Image", "Carousel", "Short video"];

/** X counts every character; a post has to fit in one. */
export const X_LIMIT = 280;

/**
 * The free content sample: one ready-to-post social media post, plus the three themes
 * a full content plan would build on (used in the "want the full plan?" call to action).
 *
 * Reports saved before this change may contain 14 posts or other platforms; the report shows the first post.
 */
export const ContentPackSchema = z
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
          hook: z.string().min(1).max(160),
          body: z.string().min(1).max(1000),
          cta: z.string().min(1),
          hashtags: z.array(z.string().min(1)).max(4),
          visualText: z.string().max(70).nullable(),
        }),
      )
      .length(1),
  })
  .superRefine((pack, ctx) => {
    const pillarNames = new Set(pack.pillars.map((p) => p.name));
    pack.posts.forEach((post, i) => {
      if (!pillarNames.has(post.pillar)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["posts", i, "pillar"],
          message: `"${post.pillar}" is not one of the theme names; use a theme name exactly as written`,
        });
      }
      if (VISUAL_FORMATS.includes(post.format) && !post.visualText) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["posts", i, "visualText"],
          message: `a "${post.format}" post needs visualText: the short headline shown on the image`,
        });
      }
      if (post.platform === "Instagram" && post.format === "Text post") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["posts", i, "format"],
          message: 'Instagram posts need a visual: use "Image", "Carousel" or "Short video"',
        });
      }
      if (post.platform === "X") {
        const length = [post.hook, post.body, post.cta, post.hashtags.map((h) => `#${h}`).join(" ")]
          .filter(Boolean)
          .join("\n\n").length;
        if (length > X_LIMIT) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["posts", i, "body"],
            message: `an X post must fit in ${X_LIMIT} characters including hook, cta and hashtags; this one is ${length}. Shorten it`,
          });
        }
      }
    });
  });

export type ContentPack = z.infer<typeof ContentPackSchema>;

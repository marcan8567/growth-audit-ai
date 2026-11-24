import { z } from "zod";

export const PLATFORMS = ["LinkedIn", "Instagram", "X", "Facebook", "TikTok", "YouTube", "Blog", "Newsletter"] as const;
export const FORMATS = ["Text post", "Carousel", "Short video", "Image", "Thread", "Article", "Email"] as const;

/**
 * The free content sample: one ready-to-post social media post, plus the three themes
 * a full content plan would build on (used in the "want the full plan?" call to action).
 *
 * Reports saved before this change contain 14 posts; the report page shows only the first.
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
          hashtags: z.array(z.string().min(1)).max(5),
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
    });
  });

export type ContentPack = z.infer<typeof ContentPackSchema>;

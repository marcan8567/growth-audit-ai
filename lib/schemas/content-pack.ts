import { z } from "zod";

export const PLATFORMS = ["LinkedIn", "Instagram", "X", "Facebook", "TikTok", "YouTube", "Blog", "Newsletter"] as const;
export const FORMATS = ["Text post", "Carousel", "Short video", "Image", "Thread", "Article", "Email"] as const;

export const ContentPackSchema = z
  .object({
    strategy: z.string().min(1),
    pillars: z
      .array(z.object({ name: z.string().min(1), why: z.string().min(1) }))
      .length(3),
    posts: z
      .array(
        z.object({
          day: z.number().int().min(1).max(14),
          platform: z.enum(PLATFORMS),
          format: z.enum(FORMATS),
          pillar: z.string().min(1),
          hook: z.string().min(1).max(160),
          body: z.string().min(1).max(1000),
          cta: z.string().min(1),
          hashtags: z.array(z.string().min(1)).max(5),
        }),
      )
      .length(14),
  })
  .superRefine((pack, ctx) => {
    const days = pack.posts.map((p) => p.day).sort((a, b) => a - b);
    if (days.some((day, i) => day !== i + 1)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["posts"], message: "posts must cover days 1 to 14, one post per day" });
    }
    const pillarNames = new Set(pack.pillars.map((p) => p.name));
    pack.posts.forEach((post, i) => {
      if (!pillarNames.has(post.pillar)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["posts", i, "pillar"],
          message: `"${post.pillar}" is not one of the pillar names; use a pillar name exactly as written`,
        });
      }
    });
  });

export type ContentPack = z.infer<typeof ContentPackSchema>;

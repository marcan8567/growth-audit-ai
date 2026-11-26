"use client";

import { useState } from "react";
import type { Brand } from "@/lib/reader/brand";
import type { SocialLink } from "@/lib/reader/types";

/**
 * A suggested post shown the way it would look in that platform's feed, posted by the audited company.
 * Layouts and colours follow each platform; no official logos, and no invented likes or follower counts.
 */

// Loose on purpose: reports saved before this design may have other platforms, formats or no visualText.
export interface PreviewPost {
  platform: string;
  format: string;
  hook: string;
  body: string;
  cta: string;
  hashtags: string[];
  visualText?: string | null;
}

interface Props {
  post: PreviewPost;
  brand: Brand;
  domain: string;
  socialLinks: SocialLink[];
}

export function SocialPostPreview(props: Props) {
  switch (props.post.platform) {
    case "LinkedIn":
      return <LinkedInPost {...props} />;
    case "X":
      return <XPost {...props} />;
    case "Instagram":
      return <InstagramPost {...props} />;
    case "Facebook":
      return <FacebookPost {...props} />;
    default:
      return <GenericPost {...props} />;
  }
}

/** The full text as it would be pasted into the platform. */
export function postText(post: PreviewPost): string {
  const tags = post.hashtags.map((h) => `#${h.replace(/^#/, "")}`).join(" ");
  return [post.hook, post.body, post.cta, tags].filter(Boolean).join("\n\n");
}

/* ---------- Platforms ---------- */

const SYSTEM_FONT = { fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' };

function LinkedInPost({ post, brand, domain }: Props) {
  return (
    <div style={SYSTEM_FONT} className="flex h-full flex-col overflow-hidden rounded-lg border border-[#e0dfdc] bg-white text-[13px] text-[#191919]">
      <div className="flex items-start gap-2 px-4 pt-3">
        <Avatar brand={brand} domain={domain} size={40} shape="square" />
        <div className="min-w-0 flex-1 leading-tight">
          <p className="truncate font-semibold">{brand.name}</p>
          <p className="truncate text-[12px] text-[#666]">{domain}</p>
          <p className="mt-0.5 flex items-center gap-1 text-[12px] text-[#666]">
            Now <Globe />
          </p>
        </div>
        <span className="shrink-0 text-[13px] font-semibold text-[#0a66c2]">+ Follow</span>
      </div>
      {/* Grows to fill the card, so the action bar sits at the bottom when the X post next to it is taller */}
      <div className="flex-1">
        <ExpandableText post={post} tagColor="text-[#0a66c2]" moreLabel="…see more" className="px-4 pt-2 pb-2" />
        {hasVisual(post) && <Visual post={post} brand={brand} domain={domain} aspect="aspect-[1.91/1]" />}
      </div>
      <ActionBar
        color="text-[#666]"
        items={[
          ["Like", <ThumbIcon key="i" />],
          ["Comment", <CommentIcon key="i" />],
          ["Repost", <RepostIcon key="i" />],
          ["Send", <SendIcon key="i" />],
        ]}
      />
    </div>
  );
}

function XPost({ post, brand, domain, socialLinks }: Props) {
  const handle = handleFrom(socialLinks, "X", brand.name);
  return (
    <div className="h-full">
      <div style={SYSTEM_FONT} className="flex h-full gap-3 rounded-2xl border border-[#cfd9de] bg-white px-4 py-3 text-[14px] text-[#0f1419]">
        <Avatar brand={brand} domain={domain} size={36} shape="circle" />
        <div className="flex min-w-0 flex-1 flex-col">
          <p className="flex items-center gap-1 truncate leading-5">
            <span className="truncate font-bold">{brand.name}</span>
            <span className="truncate text-[#536471]">@{handle}</span>
            <span className="text-[#536471]">· now</span>
          </p>
          <div className="mt-0.5 whitespace-pre-line leading-5">
            <PostText post={post} tagColor="text-[#1d9bf0]" />
          </div>
          {hasVisual(post) && (
            <div className="mt-3 overflow-hidden rounded-2xl border border-[#cfd9de]">
              <Visual post={post} brand={brand} domain={domain} aspect="aspect-[16/9]" />
            </div>
          )}
          <div className="mt-auto flex max-w-md justify-between pt-3 text-[#536471]">
            <CommentIcon />
            <RepostIcon />
            <HeartIcon />
            <ChartIcon />
            <ShareIcon />
          </div>
        </div>
      </div>
    </div>
  );
}

function InstagramPost({ post, brand, domain, socialLinks }: Props) {
  const handle = handleFrom(socialLinks, "Instagram", brand.name);
  const [open, setOpen] = useState(false);
  const caption = [post.hook, post.body, post.cta].filter(Boolean).join("\n\n");
  return (
    <div style={SYSTEM_FONT} className="mx-auto max-w-[470px] overflow-hidden rounded-lg border border-[#dbdbdb] bg-white text-[14px] text-[#000]">
      <div className="flex items-center gap-3 px-3 py-2.5">
        <span className="rounded-full bg-[conic-gradient(from_180deg,#feda75,#fa7e1e,#d62976,#962fbf,#4f5bd5,#feda75)] p-[2px]">
          <span className="block rounded-full bg-white p-[2px]">
            <Avatar brand={brand} domain={domain} size={32} shape="circle" />
          </span>
        </span>
        <span className="flex-1 truncate font-semibold">{handle}</span>
        <span className="text-lg leading-none">···</span>
      </div>
      <Visual post={post} brand={brand} domain={domain} aspect={post.format === "Short video" ? "aspect-[4/5]" : "aspect-square"} />
      <div className="relative flex items-center gap-4 px-3 pt-3">
        <HeartIcon />
        <CommentIcon />
        <SendIcon />
        {post.format === "Carousel" && <CarouselDots count={slideCount(post)} />}
        <span className="ml-auto">
          <BookmarkIcon />
        </span>
      </div>
      <div className="px-3 pt-2 pb-3 leading-[18px]">
        <p className={open ? "whitespace-pre-line" : "line-clamp-2 whitespace-pre-line"}>
          <span className="font-semibold">{handle}</span> {caption}
          {post.hashtags.length > 0 && (
            <>
              {"\n\n"}
              <span className="text-[#00376b]">{post.hashtags.map((h) => `#${h.replace(/^#/, "")}`).join(" ")}</span>
            </>
          )}
        </p>
        {!open && (
          <button type="button" onClick={() => setOpen(true)} className="text-[#737373]">
            more
          </button>
        )}
      </div>
    </div>
  );
}

function FacebookPost({ post, brand, domain }: Props) {
  return (
    <div style={SYSTEM_FONT} className="overflow-hidden rounded-lg border border-[#dadde1] bg-white text-[15px] text-[#050505]">
      <div className="flex items-center gap-2 px-4 pt-3">
        <Avatar brand={brand} domain={domain} size={40} shape="circle" />
        <div className="leading-tight">
          <p className="font-semibold">{brand.name}</p>
          <p className="flex items-center gap-1 text-[13px] text-[#65676b]">
            Just now <Globe />
          </p>
        </div>
      </div>
      <ExpandableText post={post} tagColor="text-[#385898]" moreLabel="See more" className="px-4 pt-2 pb-3" />
      {hasVisual(post) && <Visual post={post} brand={brand} domain={domain} aspect="aspect-[1.91/1]" />}
      <ActionBar
        color="text-[#65676b]"
        items={[
          ["Like", <ThumbIcon key="i" />],
          ["Comment", <CommentIcon key="i" />],
          ["Share", <ShareIcon key="i" />],
        ]}
      />
    </div>
  );
}

/** Older reports may suggest a blog post, newsletter or video platform: a clean, neutral card. */
function GenericPost({ post, brand, domain }: Props) {
  return (
    <div className="rounded-lg border border-stone-200 bg-white p-5 text-sm">
      <div className="flex items-center gap-2">
        <Avatar brand={brand} domain={domain} size={36} shape="circle" />
        <span className="font-semibold">{brand.name}</span>
      </div>
      <div className="mt-3 whitespace-pre-line leading-relaxed text-stone-700">
        <PostText post={post} tagColor="text-emerald-700" />
      </div>
    </div>
  );
}

/* ---------- Shared pieces ---------- */

function PostText({ post, tagColor }: { post: PreviewPost; tagColor: string }) {
  return (
    <>
      {post.hook}
      {post.body ? `\n\n${post.body}` : ""}
      {post.cta ? `\n\n${post.cta}` : ""}
      {post.hashtags.length > 0 && (
        <>
          {"\n\n"}
          <span className={tagColor}>{post.hashtags.map((h) => `#${h.replace(/^#/, "")}`).join(" ")}</span>
        </>
      )}
    </>
  );
}

/** Long posts are cut after three lines with a "see more", like LinkedIn and Facebook do. */
function ExpandableText({
  post,
  tagColor,
  moreLabel,
  className,
}: {
  post: PreviewPost;
  tagColor: string;
  moreLabel: string;
  className: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className={className}>
      <p className={`whitespace-pre-line leading-[1.35] ${open ? "" : "line-clamp-5"}`}>
        <PostText post={post} tagColor={tagColor} />
      </p>
      {!open && (
        <button type="button" onClick={() => setOpen(true)} className="mt-0.5 text-[#666] hover:underline">
          {moreLabel}
        </button>
      )}
    </div>
  );
}

/** The designed visual: the headline on the brand's colour, like a branded social graphic. */
function Visual({ post, brand, domain, aspect }: { post: PreviewPost; brand: Brand; domain: string; aspect: string }) {
  const bg = brandColor(brand, domain);
  const fg = readableOn(bg);
  const text = post.visualText || post.hook;
  return (
    <div
      className={`relative flex w-full flex-col justify-between overflow-hidden p-[7%] ${aspect}`}
      style={{ background: bg, color: fg, containerType: "inline-size" }}
    >
      {post.format === "Carousel" && (
        <span className="absolute right-3 top-3 rounded-full px-2 py-0.5 text-xs font-medium" style={{ background: "rgba(0,0,0,.45)", color: "#fff" }}>
          1/{slideCount(post)}
        </span>
      )}
      <span />
      <p className="max-w-[16ch] text-balance font-bold leading-[1.05] tracking-tight" style={{ fontSize: "clamp(1.4rem, 8.5cqw, 3.2rem)" }}>
        {text}
      </p>
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold opacity-80">{brand.name}</span>
        {post.format === "Short video" && (
          <span className="flex h-11 w-11 items-center justify-center rounded-full" style={{ background: "rgba(255,255,255,.9)" }}>
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
              <path d="M8 5v14l11-7z" fill="#111" />
            </svg>
          </span>
        )}
      </div>
    </div>
  );
}

function Avatar({ brand, domain, size, shape }: { brand: Brand; domain: string; size: number; shape: "circle" | "square" }) {
  const [failed, setFailed] = useState(false);
  const radius = shape === "circle" ? "rounded-full" : "rounded-md";
  if (brand.iconUrl && !failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- the company's own icon, loaded from their site
      <img
        src={brand.iconUrl}
        alt=""
        width={size}
        height={size}
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
        className={`shrink-0 border border-black/10 bg-[#e9ebee] object-contain ${radius}`}
        style={{ width: size, height: size }}
      />
    );
  }
  const bg = brandColor(brand, domain);
  return (
    <span
      className={`flex shrink-0 items-center justify-center font-bold ${radius}`}
      style={{ width: size, height: size, background: bg, color: readableOn(bg), fontSize: size * 0.42 }}
      aria-hidden="true"
    >
      {brand.name.charAt(0).toUpperCase()}
    </span>
  );
}

function ActionBar({ items, color }: { items: [string, React.ReactNode][]; color: string }) {
  return (
    <div className={`mx-3 flex justify-around border-t border-black/10 py-0.5 text-[12px] font-semibold ${color}`}>
      {items.map(([label, icon]) => (
        <span key={label} className="flex items-center gap-1 px-1.5 py-1.5">
          {icon}
          <span className="hidden sm:inline">{label}</span>
        </span>
      ))}
    </div>
  );
}

function CarouselDots({ count }: { count: number }) {
  return (
    <span className="absolute left-1/2 flex -translate-x-1/2 gap-1" aria-hidden="true">
      {Array.from({ length: Math.min(count, 6) }, (_, i) => (
        <span key={i} className={`h-1.5 w-1.5 rounded-full ${i === 0 ? "bg-[#0095f6]" : "bg-[#a8a8a8]"}`} />
      ))}
    </span>
  );
}

/* ---------- Helpers ---------- */

const hasVisual = (post: PreviewPost) => ["Image", "Carousel", "Short video"].includes(post.format);

/** A carousel's body has one line per slide; the cover slide is 1. */
const slideCount = (post: PreviewPost) => Math.max(2, Math.min(10, post.body.split("\n").filter((l) => l.trim()).length + 1));

/** "@stripe" from a linked x.com/stripe profile, else a handle made from the company name. */
function handleFrom(links: SocialLink[], platform: "X" | "Instagram", name: string): string {
  const link = links.find((l) => l.platform === platform);
  const fromLink = link?.url.match(/^https?:\/\/(?:www\.)?(?:x|twitter|instagram)\.com\/([A-Za-z0-9_.]{2,30})\/?/i)?.[1];
  if (fromLink && !["intent", "share", "home", "p", "explore"].includes(fromLink.toLowerCase())) return fromLink;
  return name.toLowerCase().replace(/[^a-z0-9_]/g, "") || "company";
}

// Used when a site doesn't declare a brand colour: each domain always gets the same one.
const PALETTE = ["#1f3a5f", "#2f5d50", "#6b2d5c", "#8a3b12", "#24476b", "#3d3a7a", "#7a1f2b", "#22543d"];

function brandColor(brand: Brand, domain: string): string {
  if (brand.color && !isNearWhite(brand.color)) return brand.color;
  let hash = 0;
  for (const ch of domain) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return PALETTE[hash % PALETTE.length];
}

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

const isNearWhite = (hex: string) => luminance(hex) > 0.85;
const readableOn = (hex: string) => (luminance(hex) > 0.45 ? "#111111" : "#ffffff");

/* ---------- Icons (simple outlines, not platform logos) ---------- */

const iconProps = { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };

const Globe = () => (
  <svg {...iconProps} width={12} height={12}>
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
  </svg>
);
const ThumbIcon = () => (
  <svg {...iconProps}>
    <path d="M7 11v9H4v-9zM7 11l4-8a2 2 0 0 1 3 2l-1 5h6a2 2 0 0 1 2 2l-2 7a2 2 0 0 1-2 1H7" />
  </svg>
);
const CommentIcon = () => (
  <svg {...iconProps}>
    <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z" />
  </svg>
);
const RepostIcon = () => (
  <svg {...iconProps}>
    <path d="M17 2l3 3-3 3M4 11V9a4 4 0 0 1 4-4h12M7 22l-3-3 3-3M20 13v2a4 4 0 0 1-4 4H4" />
  </svg>
);
const SendIcon = () => (
  <svg {...iconProps}>
    <path d="M22 2L11 13M22 2l-7 20-4-9-9-4z" />
  </svg>
);
const HeartIcon = () => (
  <svg {...iconProps}>
    <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
  </svg>
);
const ChartIcon = () => (
  <svg {...iconProps}>
    <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
  </svg>
);
const ShareIcon = () => (
  <svg {...iconProps}>
    <path d="M12 3v13M7 8l5-5 5 5M5 14v6h14v-6" />
  </svg>
);
const BookmarkIcon = () => (
  <svg {...iconProps}>
    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
  </svg>
);

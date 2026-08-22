import type { PostColorScheme } from "./colorSchemes";

export type PostElementColorKey = "overlay" | "headline" | "highlight" | "accent" | "badge" | "page" | "label" | "heart" | "thumb";

export type PostElementColors = Record<PostElementColorKey, string>;

export const elementColorControls: Array<{ key: PostElementColorKey; label: string; detail: string }> = [
  { key: "overlay", label: "Overlay / base", detail: "Artwork shade and dark panels" },
  { key: "headline", label: "Headline", detail: "Primary headline text" },
  { key: "highlight", label: "Highlighted words", detail: "Words in yellow treatment" },
  { key: "accent", label: "Accent rule", detail: "Rules, borders, and dividers" },
  { key: "badge", label: "Badge / kicker", detail: "Bottom-left metadata" },
  { key: "page", label: "Page name", detail: "Bottom-right metadata" },
  { key: "label", label: "Template label", detail: "Breaking, signal, and feature tags" },
  { key: "heart", label: "Heart reaction", detail: "First poll reaction" },
  { key: "thumb", label: "Thumb reaction", detail: "Second poll reaction" },
];

export function colorsFromScheme(scheme: PostColorScheme): PostElementColors {
  return {
    overlay: scheme.ink,
    headline: scheme.text,
    highlight: "#F6C400",
    accent: scheme.accent,
    badge: scheme.accent,
    page: scheme.text,
    label: scheme.signal,
    heart: scheme.signal,
    thumb: scheme.accent,
  };
}

export function setElementColor(colors: PostElementColors, key: PostElementColorKey, value: string): PostElementColors {
  return { ...colors, [key]: value };
}

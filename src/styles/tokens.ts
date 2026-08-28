/**
 * Design tokens as CSS custom properties.
 *
 * The naming mirrors the Untitled UI semantic layer (`bg-primary`, `text-tertiary`,
 * `border-brand`, `*_hover`, `*_on-brand`) so the vocabulary matches the rest of our
 * projects, even though this package ships plain CSS instead of Tailwind.
 *
 * Every variable is prefixed `--szan-` and lives on `:root`. They are a public API:
 * a consuming project may override any of them. Renaming one is a breaking change.
 *
 * Dark mode follows `prefers-color-scheme`, with `[data-szan-theme="light" | "dark"]`
 * on `<html>` as a manual override.
 */

import type { AnnotationType, Comment } from "../types";

export const PREFIX = "szan";
export const THEME_ATTR = "data-szan-theme";

/** Slug used in `data-szan-status`, because the status values contain spaces. */
export const STATUS_SLUGS: Record<Comment["status"], string> = {
  "Open": "open",
  "In behandeling": "pending",
  "Opgelost": "resolved",
};

export const ANNOTATION_TYPES: AnnotationType[] = [
  "documentation",
  "pro",
  "question",
  "con",
  "suggestion",
  "critical",
  "user-insight",
];

type Vars = Record<string, string>;

// ── Light ────────────────────────────────────────────────────────────────────

const LIGHT: Vars = {
  // Surfaces
  "--szan-bg-primary": "#FFFFFF",
  "--szan-bg-primary_hover": "#F9FAFB",
  "--szan-bg-secondary": "#F9FAFB",
  "--szan-bg-secondary_hover": "#F2F4F7",
  "--szan-bg-tertiary": "#F2F4F7",
  "--szan-bg-quaternary": "#EAECF0",
  "--szan-bg-disabled": "#F2F4F7",

  // Foreground
  "--szan-text-primary": "#101828",
  "--szan-text-secondary": "#344054",
  "--szan-text-tertiary": "#475467",
  // 4.97:1 on bg-primary. The old muted grey (#98A2B3) sat at 2.58:1 and carried
  // real content — timestamps, authors, breadcrumbs — so it failed WCAG 1.4.3.
  "--szan-text-quaternary": "#667085",
  "--szan-text-disabled": "#98A2B3",

  // Structure
  "--szan-border-primary": "#D0D5DD",
  "--szan-border-secondary": "#EAECF0",
  // Untitled UI's own field border. It is 1.6:1, below what WCAG 1.4.11 asks of
  // a control whose only boundary is that line — the focus ring below carries
  // the weight instead. Override this token to darken it.
  "--szan-border-input": "#D0D5DD",

  // Focus — 4.58:1 on bg-primary, 4.40:1 on bg-secondary
  "--szan-outline-focus-ring": "#1570EF",

  // Statuses
  "--szan-bg-error-primary": "#FEF3F2",
  "--szan-border-error": "#FECDCA",
  "--szan-text-error-primary": "#B42318",
  "--szan-bg-warning-primary": "#FFF6ED",
  "--szan-border-warning": "#F9DBAF",
  "--szan-text-warning-primary": "#B93815",
  "--szan-bg-success-primary": "#ECFDF3",
  "--szan-border-success": "#ABEFC6",
  "--szan-text-success-primary": "#067647",

  // Feedback accent — the blue the inspector and comment badges share
  "--szan-bg-feedback": "#EFF8FF",
  "--szan-border-feedback": "#B2DDFF",
  "--szan-text-feedback": "#175CD3",
  "--szan-bg-feedback-solid": "#175CD3",
  "--szan-text-feedback_on-solid": "#FFFFFF",

  // Fills for the boxes drawn over host elements while pointing at them
  "--szan-overlay-fill": "rgba(21, 112, 239, 0.06)",
  "--szan-overlay-fill-strong": "rgba(21, 112, 239, 0.10)",
  "--szan-overlay-ring": "rgba(21, 112, 239, 0.16)",

  // Annotation types
  "--szan-type-documentation-bg": "#F5F5F5",
  "--szan-type-documentation-border": "#D0D5DD",
  "--szan-type-documentation-fg": "#344054",
  "--szan-type-pro-bg": "#ECFDF3",
  "--szan-type-pro-border": "#ABEFC6",
  "--szan-type-pro-fg": "#067647",
  "--szan-type-question-bg": "#EFF8FF",
  "--szan-type-question-border": "#B2DDFF",
  "--szan-type-question-fg": "#175CD3",
  "--szan-type-con-bg": "#FEF3F2",
  "--szan-type-con-border": "#FECDCA",
  "--szan-type-con-fg": "#B42318",
  "--szan-type-suggestion-bg": "#F4F3FF",
  "--szan-type-suggestion-border": "#D9D6FE",
  "--szan-type-suggestion-fg": "#5925DC",
  "--szan-type-critical-bg": "#FFF4ED",
  "--szan-type-critical-border": "#F9DBAF",
  "--szan-type-critical-fg": "#B93815",
  "--szan-type-user-insight-bg": "#FDF2FA",
  "--szan-type-user-insight-border": "#FCCEEE",
  "--szan-type-user-insight-fg": "#C11574",

  // Elevation
  "--szan-shadow-xs": "0 1px 2px 0 rgba(16, 24, 40, 0.05)",
  "--szan-shadow-sm":
    "0 1px 3px 0 rgba(16, 24, 40, 0.10), 0 1px 2px -1px rgba(16, 24, 40, 0.06)",
  "--szan-shadow-md":
    "0 4px 8px -2px rgba(16, 24, 40, 0.10), 0 2px 4px -2px rgba(16, 24, 40, 0.06)",
  "--szan-shadow-lg":
    "0 12px 16px -4px rgba(16, 24, 40, 0.08), 0 4px 6px -2px rgba(16, 24, 40, 0.03)",
  "--szan-shadow-xl":
    "0 20px 24px -4px rgba(16, 24, 40, 0.08), 0 8px 8px -4px rgba(16, 24, 40, 0.03)",
  "--szan-shadow-border":
    "0 0 0 1px rgba(16, 24, 40, 0.06), 0 1px 2px -1px rgba(16, 24, 40, 0.06), 0 2px 4px 0 rgba(16, 24, 40, 0.04)",
};

// ── Dark ─────────────────────────────────────────────────────────────────────

const DARK: Vars = {
  "--szan-bg-primary": "#0C111D",
  "--szan-bg-primary_hover": "#1F242F",
  "--szan-bg-secondary": "#161B26",
  "--szan-bg-secondary_hover": "#1F242F",
  "--szan-bg-tertiary": "#1F242F",
  "--szan-bg-quaternary": "#333741",
  "--szan-bg-disabled": "#1F242F",

  "--szan-text-primary": "#F5F5F6",
  "--szan-text-secondary": "#CECFD2",
  "--szan-text-tertiary": "#94969C",
  "--szan-text-quaternary": "#94969C",
  "--szan-text-disabled": "#85888E",

  "--szan-border-primary": "#333741",
  "--szan-border-secondary": "#1F242F",
  "--szan-border-input": "#333741",

  "--szan-outline-focus-ring": "#84CAFF",

  "--szan-bg-error-primary": "#55160C",
  "--szan-border-error": "#912018",
  "--szan-text-error-primary": "#FDA29B",
  "--szan-bg-warning-primary": "#4E1D09",
  "--szan-border-warning": "#93370D",
  "--szan-text-warning-primary": "#FEC84B",
  "--szan-bg-success-primary": "#053321",
  "--szan-border-success": "#085D3A",
  "--szan-text-success-primary": "#75E0A7",

  "--szan-bg-feedback": "#102A56",
  "--szan-border-feedback": "#1849A9",
  "--szan-text-feedback": "#84CAFF",
  "--szan-bg-feedback-solid": "#1570EF",
  "--szan-text-feedback_on-solid": "#FFFFFF",

  "--szan-overlay-fill": "rgba(132, 202, 255, 0.10)",
  "--szan-overlay-fill-strong": "rgba(132, 202, 255, 0.16)",
  "--szan-overlay-ring": "rgba(132, 202, 255, 0.22)",

  "--szan-type-documentation-bg": "#1F242F",
  "--szan-type-documentation-border": "#333741",
  "--szan-type-documentation-fg": "#CECFD2",
  "--szan-type-pro-bg": "#053321",
  "--szan-type-pro-border": "#085D3A",
  "--szan-type-pro-fg": "#75E0A7",
  "--szan-type-question-bg": "#102A56",
  "--szan-type-question-border": "#1849A9",
  "--szan-type-question-fg": "#84CAFF",
  "--szan-type-con-bg": "#55160C",
  "--szan-type-con-border": "#912018",
  "--szan-type-con-fg": "#FDA29B",
  "--szan-type-suggestion-bg": "#2E125E",
  "--szan-type-suggestion-border": "#5925DC",
  "--szan-type-suggestion-fg": "#BDB4FE",
  "--szan-type-critical-bg": "#4E1D09",
  "--szan-type-critical-border": "#932F19",
  "--szan-type-critical-fg": "#F7B27A",
  "--szan-type-user-insight-bg": "#4E0D30",
  "--szan-type-user-insight-border": "#9E165F",
  "--szan-type-user-insight-fg": "#FAA7E0",

  // Shadows read as noise on a dark surface; a ring carries the elevation instead.
  "--szan-shadow-xs": "0 0 0 1px rgba(255, 255, 255, 0.06)",
  "--szan-shadow-sm":
    "0 0 0 1px rgba(255, 255, 255, 0.08), 0 1px 3px 0 rgba(0, 0, 0, 0.40)",
  "--szan-shadow-md":
    "0 0 0 1px rgba(255, 255, 255, 0.08), 0 4px 8px -2px rgba(0, 0, 0, 0.50)",
  "--szan-shadow-lg":
    "0 0 0 1px rgba(255, 255, 255, 0.08), 0 12px 16px -4px rgba(0, 0, 0, 0.55)",
  "--szan-shadow-xl":
    "0 0 0 1px rgba(255, 255, 255, 0.10), 0 20px 24px -4px rgba(0, 0, 0, 0.60)",
  "--szan-shadow-border": "0 0 0 1px rgba(255, 255, 255, 0.08)",
};

// Brand tokens are derived from a single `--szan-brand`, so a consumer only has to
// set one colour. The static declaration before each color-mix() is the fallback
// for browsers without it.
const BRAND_LIGHT = `
  --szan-brand: #344054;
  --szan-bg-brand-solid: var(--szan-brand);
  --szan-bg-brand-solid_hover: #101828;
  --szan-bg-brand-solid_hover: color-mix(in oklab, var(--szan-brand), black 14%);
  --szan-bg-brand-primary: #F2F4F7;
  --szan-bg-brand-primary: color-mix(in oklab, var(--szan-brand), white 92%);
  --szan-border-brand: var(--szan-brand);
  --szan-text-brand-secondary: var(--szan-brand);
  --szan-text-primary_on-brand: #FFFFFF;
`;

const BRAND_DARK = `
  --szan-bg-brand-solid: var(--szan-brand);
  --szan-bg-brand-solid_hover: #475467;
  --szan-bg-brand-solid_hover: color-mix(in oklab, var(--szan-brand), white 14%);
  --szan-bg-brand-primary: #1F242F;
  --szan-bg-brand-primary: color-mix(in oklab, var(--szan-brand), black 72%);
  --szan-border-brand: #667085;
  --szan-border-brand: color-mix(in oklab, var(--szan-brand), white 45%);
  --szan-text-brand-secondary: #98A2B3;
  --szan-text-brand-secondary: color-mix(in oklab, var(--szan-brand), white 58%);
`;

// ── Scales ───────────────────────────────────────────────────────────────────

// Theme-independent, so they are declared once.
const SCALES = `
  --szan-space-0-5: 2px;
  --szan-space-1: 4px;
  --szan-space-1-5: 6px;
  --szan-space-2: 8px;
  --szan-space-2-5: 10px;
  --szan-space-3: 12px;
  --szan-space-4: 16px;
  --szan-space-5: 20px;
  --szan-space-6: 24px;
  --szan-space-8: 32px;

  --szan-radius-xs: 2px;
  --szan-radius-sm: 4px;
  --szan-radius-md: 6px;
  --szan-radius-lg: 10px;
  --szan-radius-xl: 12px;
  --szan-radius-2xl: 16px;
  --szan-radius-full: 9999px;

  --szan-font-body: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
    "Helvetica Neue", Arial, sans-serif;
  --szan-font-mono: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas,
    "Liberation Mono", monospace;

  --szan-text-2xs: 11px;
  --szan-text-xs: 12px;
  --szan-text-sm: 13px;
  --szan-text-md: 14px;
  --szan-text-lg: 18px;

  --szan-leading-none: 1;
  --szan-leading-snug: 1.4;
  --szan-leading-normal: 1.5;

  --szan-duration-fast: 100ms;
  --szan-duration: 150ms;
  --szan-duration-slow: 200ms;
  --szan-ease: cubic-bezier(0.2, 0, 0, 1);

  /* Base is rewritten at runtime from settings.zIndex; the rest are offsets on it. */
  --szan-z-base: 9000;
  /* The inspector toggle sits below the panel, so the panel can cover it. */
  --szan-z-inspector-toggle: 10;
  --szan-z-badge-feedback: 19;
  --szan-z-badge: 20;
  --szan-z-popover: 30;
  --szan-z-overlay: 40;
  --szan-z-highlight: 45;
  --szan-z-inspector-popover: 50;
  --szan-z-toolbar: 999;
`;

function declarations(vars: Vars): string {
  return Object.entries(vars)
    .map(([name, value]) => `  ${name}: ${value};`)
    .join("\n");
}

const LIGHT_DECLS = `${declarations(LIGHT)}\n${BRAND_LIGHT.trim()}`;
const DARK_DECLS = `${declarations(DARK)}\n${BRAND_DARK.trim()}`;

export const TOKENS_CSS = `
:root {
${SCALES.trim()}
${LIGHT_DECLS}
}

@media (prefers-color-scheme: dark) {
  :root:not([${THEME_ATTR}="light"]) {
${DARK_DECLS}
  }
}

:root[${THEME_ATTR}="dark"] {
${DARK_DECLS}
}
`;

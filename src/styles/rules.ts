/**
 * Component rules.
 *
 * Every selector carries the `szan-` prefix and every element we render also carries
 * `.szan-root`. That is what keeps a host application's CSS out of this module and
 * this module's CSS out of the host: `.szan-root *` outweighs a bare `button {}` or
 * `* {}` from the page around us.
 *
 * The reset block comes first on purpose. `.szan-root *` and `.szan-panel__title`
 * have the same specificity, so source order decides, and the component rules have
 * to win.
 */

import { ANNOTATION_TYPES, STATUS_SLUGS } from "./tokens";

// ── Reset and base ───────────────────────────────────────────────────────────

const BASE = `
.szan-root,
.szan-root *,
.szan-root *::before,
.szan-root *::after {
  /* The one !important in the sheet. A host page forcing content-box on every
     element would otherwise break every width in this module; the rest of the
     reset can lose that fight without anything breaking structurally. */
  box-sizing: border-box !important;
  margin: 0;
  padding: 0;
  border: 0 solid transparent;
  outline: 0;
  font: inherit;
  letter-spacing: normal;
  text-transform: none;
  text-align: start;
  text-decoration: none;
  text-indent: 0;
  color: inherit;
  background: transparent;
  list-style: none;
  float: none;
  min-width: 0;
}

.szan-root {
  font-family: var(--szan-font-body);
  font-size: var(--szan-text-md);
  font-weight: 400;
  font-style: normal;
  line-height: var(--szan-leading-normal);
  color: var(--szan-text-primary);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.szan-root button,
.szan-root input,
.szan-root textarea {
  -webkit-appearance: none;
  appearance: none;
}

.szan-root button {
  cursor: pointer;
}

.szan-root button:disabled {
  cursor: not-allowed;
}

.szan-root :focus-visible,
.szan-root:focus-visible {
  outline: 2px solid var(--szan-outline-focus-ring);
  outline-offset: 2px;
}

/* Keeps a wrapper out of its parent's layout entirely. */
.szan-contents {
  display: contents;
}

.szan-sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}

@keyframes szan-enter {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.szan-animate-in {
  animation: szan-enter var(--szan-duration-slow) var(--szan-ease) both;
}

@media (prefers-reduced-motion: reduce) {
  .szan-root,
  .szan-root * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
`;

// ── Type and status token bridges ────────────────────────────────────────────

// A `data-szan-type` / `data-szan-status` attribute maps the palette for that
// variant onto three local variables, so the rules below stay variant-agnostic.
const TYPE_BRIDGE = ANNOTATION_TYPES.map(
  (type) => `[data-szan-type="${type}"] {
  --szan-variant-bg: var(--szan-type-${type}-bg);
  --szan-variant-border: var(--szan-type-${type}-border);
  --szan-variant-fg: var(--szan-type-${type}-fg);
  --szan-variant-ring: var(--szan-type-${type}-border);
  --szan-variant-ring: color-mix(in oklab, var(--szan-type-${type}-fg) 16%, transparent);
}`
).join("\n");

const STATUS_TONE: Record<string, string> = {
  open: "error",
  pending: "warning",
  resolved: "success",
};

const STATUS_BRIDGE = Object.values(STATUS_SLUGS)
  .map((slug) => {
    const tone = STATUS_TONE[slug];
    return `[data-szan-status="${slug}"] {
  --szan-variant-bg: var(--szan-bg-${tone}-primary);
  --szan-variant-border: var(--szan-border-${tone});
  --szan-variant-fg: var(--szan-text-${tone}-primary);
}`;
  })
  .join("\n");

// ── Floating buttons ─────────────────────────────────────────────────────────

const FAB = `
.szan-fab {
  position: fixed;
  z-index: calc(var(--szan-z-base) + var(--szan-z-toolbar));
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: 1px solid var(--szan-border-primary);
  border-radius: var(--szan-radius-lg);
  background: var(--szan-bg-primary);
  color: var(--szan-text-tertiary);
  box-shadow: var(--szan-shadow-xs);
  transition:
    background-color var(--szan-duration) var(--szan-ease),
    border-color var(--szan-duration) var(--szan-ease),
    box-shadow var(--szan-duration) var(--szan-ease),
    transform var(--szan-duration-fast) var(--szan-ease);
}

.szan-fab:hover {
  background: var(--szan-bg-primary_hover);
  box-shadow: var(--szan-shadow-sm);
}

.szan-fab:active {
  transform: scale(0.96);
}

.szan-fab--active {
  background: var(--szan-bg-feedback-solid);
  border-color: var(--szan-bg-feedback-solid);
  color: var(--szan-text-feedback_on-solid);
}

.szan-fab--active:hover {
  background: var(--szan-bg-feedback-solid);
  border-color: var(--szan-bg-feedback-solid);
}

.szan-fab--inspector {
  z-index: calc(var(--szan-z-base) + var(--szan-z-inspector-toggle));
}

.szan-fab--dragging {
  cursor: grabbing;
  transition: none;
}

.szan-fab__count {
  position: absolute;
  top: -6px;
  right: -6px;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  padding: 0 var(--szan-space-1);
  border: 2px solid var(--szan-bg-primary);
  border-radius: var(--szan-radius-full);
  background: var(--szan-text-error-primary);
  color: var(--szan-bg-primary);
  font-size: var(--szan-text-2xs);
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  line-height: var(--szan-leading-none);
}
`;

// ── Marker badges ────────────────────────────────────────────────────────────

const MARKER = `
.szan-marker {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: 1.5px solid var(--szan-variant-border, var(--szan-border-primary));
  border-radius: var(--szan-radius-full);
  background: var(--szan-variant-bg, var(--szan-bg-tertiary));
  color: var(--szan-variant-fg, var(--szan-text-tertiary));
  box-shadow: var(--szan-shadow-sm);
  transition:
    transform var(--szan-duration) var(--szan-ease),
    box-shadow var(--szan-duration) var(--szan-ease);
}

/* Extends the hit area to 40px without growing the visible badge, which would
   cover the very element being annotated. */
.szan-marker::before {
  content: "";
  position: absolute;
  inset: -6px;
  border-radius: inherit;
}

.szan-marker:hover {
  transform: scale(1.1);
}

.szan-marker:active {
  transform: scale(0.96);
}

.szan-marker--active {
  box-shadow:
    0 0 0 4px var(--szan-variant-ring, var(--szan-overlay-ring)),
    var(--szan-shadow-sm);
}

/* The comment count next to an annotation badge is a mirror of what the panel
   already lists; it is decorative, so it takes no hit area and no pointer. */
.szan-marker--static {
  pointer-events: none;
}

.szan-marker--static::before {
  content: none;
}

.szan-marker--feedback {
  --szan-variant-bg: var(--szan-bg-feedback);
  --szan-variant-border: var(--szan-border-feedback);
  --szan-variant-fg: var(--szan-text-feedback);
  --szan-variant-ring: var(--szan-border-feedback);
  --szan-variant-ring: color-mix(in oklab, var(--szan-text-feedback) 16%, transparent);
}

.szan-marker--resolved {
  --szan-variant-bg: var(--szan-bg-tertiary);
  --szan-variant-border: var(--szan-border-primary);
  --szan-variant-fg: var(--szan-text-quaternary);
}

.szan-marker__count {
  font-size: var(--szan-text-2xs);
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  line-height: var(--szan-leading-none);
}

.szan-marker--fixed {
  position: fixed;
  z-index: calc(var(--szan-z-base) + var(--szan-z-badge));
}

.szan-marker--absolute {
  position: absolute;
  z-index: calc(var(--szan-z-base) + var(--szan-z-badge));
}

.szan-marker--behind {
  z-index: calc(var(--szan-z-base) + var(--szan-z-badge-feedback));
}

/* A dashed edge says this badge points at nothing in particular — the annotation
   is page-level, or its element is not rendered right now. */
.szan-marker--unplaced {
  border-style: dashed;
}

/* Ring drawn around a wrapped element while its marker is hovered or open. */
.szan-marker-wrap {
  position: relative;
  flex: 1;
  min-width: 0;
  border-radius: var(--szan-radius-md);
  outline: 2px solid transparent;
  outline-offset: 2px;
  transition:
    outline-color var(--szan-duration) var(--szan-ease),
    box-shadow var(--szan-duration) var(--szan-ease);
}

.szan-marker-wrap--lit {
  outline-color: var(--szan-variant-fg, var(--szan-text-feedback));
}

.szan-marker-wrap--active {
  box-shadow: 0 0 0 4px var(--szan-variant-ring, var(--szan-overlay-ring));
}
`;

// ── Popover ──────────────────────────────────────────────────────────────────

const POPOVER = `
.szan-popover {
  z-index: calc(var(--szan-z-base) + var(--szan-z-popover));
  min-width: 300px;
  max-width: 380px;
  /* The inline maxHeight from popover-position.ts is the real cap; this only
     stops a popover from running past the viewport when there is no anchor. */
  max-height: calc(100vh - var(--szan-space-8));
  overflow-y: auto;
  border: 1px solid var(--szan-border-secondary);
  border-radius: var(--szan-radius-xl);
  background: var(--szan-bg-primary);
  box-shadow: var(--szan-shadow-lg);
}

.szan-popover--inspector {
  z-index: calc(var(--szan-z-base) + var(--szan-z-inspector-popover));
  min-width: 0;
  max-width: none;
}

.szan-popover__section {
  padding: var(--szan-space-4);
}

.szan-popover__section + .szan-popover__section {
  border-top: 1px solid var(--szan-border-secondary);
}

.szan-popover__section > .szan-type-badge {
  margin-bottom: var(--szan-space-1-5);
}

.szan-popover__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--szan-space-2);
  margin-bottom: var(--szan-space-2);
}

.szan-popover__title {
  margin-bottom: var(--szan-space-1);
  font-size: var(--szan-text-md);
  font-weight: 600;
  color: var(--szan-text-primary);
  text-wrap: balance;
}

.szan-popover__body {
  font-size: var(--szan-text-md);
  line-height: var(--szan-leading-normal);
  color: var(--szan-text-secondary);
  white-space: pre-wrap;
  text-wrap: pretty;
}

.szan-popover__meta {
  margin-top: var(--szan-space-2);
  font-size: var(--szan-text-xs);
  color: var(--szan-text-quaternary);
}

.szan-mono {
  flex: 1;
  overflow: hidden;
  font-family: var(--szan-font-mono);
  font-size: var(--szan-text-sm);
  color: var(--szan-text-quaternary);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.szan-section-heading {
  display: flex;
  align-items: center;
  gap: var(--szan-space-1-5);
  margin-bottom: var(--szan-space-2);
  font-size: var(--szan-text-xs);
  font-weight: 600;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  color: var(--szan-text-quaternary);
}

.szan-count {
  padding: 0 var(--szan-space-1-5);
  border: 1px solid var(--szan-border-secondary);
  border-radius: var(--szan-radius-full);
  background: var(--szan-bg-tertiary);
  color: var(--szan-text-secondary);
  font-size: var(--szan-text-2xs);
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  letter-spacing: normal;
}
`;

// ── Badges and pills ─────────────────────────────────────────────────────────

const BADGES = `
.szan-type-badge {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  gap: var(--szan-space-1);
  padding: var(--szan-space-0-5) var(--szan-space-1-5);
  border: 1px solid var(--szan-variant-border);
  border-radius: var(--szan-radius-md);
  background: var(--szan-variant-bg);
  color: var(--szan-variant-fg);
  font-size: var(--szan-text-2xs);
  font-weight: 500;
  line-height: var(--szan-leading-none);
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

.szan-status {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  padding: var(--szan-space-0-5) var(--szan-space-2);
  border: 1px solid var(--szan-variant-border);
  border-radius: var(--szan-radius-full);
  background: var(--szan-variant-bg);
  color: var(--szan-variant-fg);
  font-size: var(--szan-text-xs);
  font-weight: 500;
}
`;

// ── Panel ────────────────────────────────────────────────────────────────────

const PANEL = `
.szan-panel {
  z-index: calc(var(--szan-z-base) + var(--szan-z-toolbar));
  /* settings.panelWidth is applied inline; these caps keep it inside a 320px
     viewport instead of forcing the host page to scroll sideways. */
  max-width: calc(100vw - var(--szan-space-8));
  max-height: calc(100vh - var(--szan-space-8));
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid var(--szan-border-secondary);
  border-radius: var(--szan-radius-xl);
  background: var(--szan-bg-primary);
  box-shadow: var(--szan-shadow-xl);
  transition:
    top var(--szan-duration-slow) var(--szan-ease),
    left var(--szan-duration-slow) var(--szan-ease),
    right var(--szan-duration-slow) var(--szan-ease),
    bottom var(--szan-duration-slow) var(--szan-ease);
}

.szan-panel--dragging {
  cursor: grabbing;
  transition: none;
}

/* Grip, tabs and close share one row. align-items: stretch lets the tabs run the
   full height so their underline lands on the header rule. */
.szan-panel__header {
  display: flex;
  align-items: stretch;
  gap: var(--szan-space-1);
  padding: 0 var(--szan-space-2) 0 var(--szan-space-3);
  border-bottom: 1px solid var(--szan-border-secondary);
}

.szan-panel__grip {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  cursor: grab;
  color: var(--szan-text-quaternary);
}

.szan-panel__grip:active {
  cursor: grabbing;
}

.szan-panel__header .szan-icon-button {
  align-self: center;
}

.szan-icon-button {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  border-radius: var(--szan-radius-md);
  color: var(--szan-text-quaternary);
  transition:
    background-color var(--szan-duration-fast) var(--szan-ease),
    color var(--szan-duration-fast) var(--szan-ease),
    transform var(--szan-duration-fast) var(--szan-ease);
}

/* 28px is the visible box; the pseudo-element brings the hit area to 40px. */
.szan-icon-button::before {
  content: "";
  position: absolute;
  inset: -6px;
}

.szan-icon-button:hover {
  background: var(--szan-bg-tertiary);
  color: var(--szan-text-secondary);
}

.szan-icon-button:active {
  transform: scale(0.96);
}

.szan-tabs {
  display: flex;
  flex: 1;
  /* Pulls the active tab's underline down onto the header's own rule. */
  margin-bottom: -1px;
}

.szan-tab {
  display: flex;
  align-items: center;
  gap: var(--szan-space-1-5);
  padding: var(--szan-space-3);
  border-bottom: 2px solid transparent;
  color: var(--szan-text-quaternary);
  font-size: var(--szan-text-md);
  transition:
    color var(--szan-duration) var(--szan-ease),
    border-color var(--szan-duration) var(--szan-ease);
}

.szan-tab:hover {
  color: var(--szan-text-secondary);
}

.szan-tab--active {
  border-bottom-color: var(--szan-border-brand);
  color: var(--szan-text-primary);
  font-weight: 600;
}

/* The counter says how much is waiting in the tab you are not looking at. Once
   you are in it, the list below answers that. */
.szan-tab--active .szan-count {
  display: none;
}

.szan-subtabs {
  display: flex;
  gap: var(--szan-space-1-5);
  padding: var(--szan-space-2-5) var(--szan-space-4) 0;
}

.szan-subtab {
  display: flex;
  align-items: center;
  gap: var(--szan-space-1-5);
  padding: var(--szan-space-1-5) var(--szan-space-3);
  border-radius: var(--szan-radius-lg);
  color: var(--szan-text-tertiary);
  font-size: var(--szan-text-md);
  font-weight: 500;
  transition:
    background-color var(--szan-duration-fast) var(--szan-ease),
    color var(--szan-duration-fast) var(--szan-ease);
}

.szan-subtab:hover {
  background: var(--szan-bg-primary_hover);
}

.szan-subtab--active {
  background: var(--szan-bg-tertiary);
  color: var(--szan-text-primary);
}

.szan-subtab__count {
  min-width: 18px;
  padding: 0 var(--szan-space-1-5);
  border: 1px solid transparent;
  border-radius: var(--szan-radius-full);
  color: var(--szan-text-quaternary);
  font-size: var(--szan-text-2xs);
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  text-align: center;
}

.szan-subtab--active .szan-subtab__count {
  border-color: var(--szan-border-secondary);
  background: var(--szan-bg-primary);
  color: var(--szan-text-secondary);
}

.szan-search {
  position: relative;
  padding: var(--szan-space-2-5) var(--szan-space-4);
}

.szan-search__icon {
  position: absolute;
  top: 50%;
  left: var(--szan-space-6);
  display: flex;
  transform: translateY(-50%);
  color: var(--szan-text-quaternary);
  pointer-events: none;
}

.szan-search .szan-input {
  padding-left: var(--szan-space-8);
}

.szan-filters {
  display: flex;
  flex-wrap: wrap;
  gap: var(--szan-space-1-5);
  padding: 0 var(--szan-space-4) var(--szan-space-2);
}

.szan-filter {
  display: flex;
  align-items: center;
  gap: var(--szan-space-1);
  padding: var(--szan-space-1) var(--szan-space-2-5);
  border: 1px solid var(--szan-border-secondary);
  border-radius: var(--szan-radius-full);
  color: var(--szan-text-tertiary);
  font-size: var(--szan-text-xs);
  font-weight: 500;
  transition:
    background-color var(--szan-duration-fast) var(--szan-ease),
    border-color var(--szan-duration-fast) var(--szan-ease),
    color var(--szan-duration-fast) var(--szan-ease);
}

.szan-filter:hover {
  border-color: var(--szan-border-primary);
  color: var(--szan-text-secondary);
}

.szan-filter--active {
  border-color: var(--szan-variant-border);
  background: var(--szan-variant-bg);
  color: var(--szan-variant-fg);
}

.szan-filter--active:hover {
  border-color: var(--szan-variant-fg);
  color: var(--szan-variant-fg);
}

.szan-list {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: var(--szan-space-1);
  overflow-y: auto;
  padding: var(--szan-space-1-5) var(--szan-space-2) var(--szan-space-2);
}

.szan-list--comments {
  gap: var(--szan-space-2);
}

.szan-empty {
  padding: var(--szan-space-6) 0;
  color: var(--szan-text-quaternary);
  font-size: var(--szan-text-xs);
  text-align: center;
}

.szan-empty--error {
  color: var(--szan-text-error-primary);
}
`;

// ── Annotation card ──────────────────────────────────────────────────────────

const CARD = `
.szan-card {
  position: relative;
  padding: var(--szan-space-3);
  border-left: 3px solid transparent;
  border-radius: var(--szan-radius-sm);
  transition: background-color var(--szan-duration-fast) var(--szan-ease);
}

/* Same reason as .szan-comment__target: the card opens an annotation and the
   breadcrumb inside it opens a route, and a button cannot contain a button. */
.szan-card__target {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  border-radius: inherit;
}

.szan-card__target:focus-visible {
  outline-offset: -3px;
}

.szan-card__target {
  cursor: pointer;
}

.szan-card:hover,
.szan-card--hovered {
  background: var(--szan-bg-primary_hover);
}

.szan-card--active {
  border-left-color: var(--szan-border-brand);
  background: var(--szan-bg-tertiary);
}

.szan-card__head {
  display: flex;
  align-items: center;
  gap: var(--szan-space-2);
  margin-bottom: var(--szan-space-1);
}

.szan-card__title {
  flex: 1;
  overflow: hidden;
  font-size: var(--szan-text-md);
  font-weight: 600;
  color: var(--szan-text-primary);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.szan-card__pin {
  display: flex;
  flex-shrink: 0;
  color: var(--szan-text-quaternary);
}

.szan-card__body {
  display: -webkit-box;
  margin-bottom: var(--szan-space-1-5);
  overflow: hidden;
  font-size: var(--szan-text-sm);
  line-height: var(--szan-leading-normal);
  color: var(--szan-text-secondary);
  text-wrap: pretty;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.szan-card__foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--szan-space-2);
  font-size: var(--szan-text-xs);
  color: var(--szan-text-quaternary);
}

.szan-meta {
  flex-shrink: 0;
}

/* Sits above the stretched card button, so it stays clickable in its own right. */
.szan-link {
  position: relative;
  z-index: 1;
  max-width: 60%;
  overflow: hidden;
  border-bottom: 1px dashed currentColor;
  color: var(--szan-text-tertiary);
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: color var(--szan-duration-fast) var(--szan-ease);
}

.szan-link:hover {
  color: var(--szan-text-primary);
}

/* 12px text would leave a 15px-tall target; WCAG 2.2 asks for 24. Padding would
   push the footer around, so the hit area grows on a pseudo-element instead. */
.szan-link::before {
  content: "";
  position: absolute;
  inset: -5px -2px;
}
`;

// ── Comments ─────────────────────────────────────────────────────────────────

const COMMENTS = `
.szan-thread {
  display: flex;
  flex-direction: column;
  gap: var(--szan-space-2);
}

.szan-comment {
  position: relative;
  padding: var(--szan-space-3);
  border: 1px solid var(--szan-border-secondary);
  border-radius: var(--szan-radius-sm);
  background: var(--szan-bg-primary);
  font-size: var(--szan-text-md);
  text-align: start;
  transition: border-color var(--szan-duration) var(--szan-ease);
}

.szan-comment--clickable:hover {
  border-color: var(--szan-text-feedback);
}

/* Which card is open has to read without the mouse resting on it. */
.szan-comment--expanded {
  border-color: var(--szan-text-feedback);
  background: var(--szan-bg-secondary);
}

/* A card with two actions — jump to the element, and open the page it is on —
   cannot nest one button inside another. The primary action is an overlay button
   the size of the card; the page link sits above it. */
.szan-comment__target {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  border-radius: inherit;
}

.szan-comment__target:focus-visible {
  outline-offset: -3px;
}


.szan-comment__label {
  margin-bottom: var(--szan-space-1);
  overflow: hidden;
  font-family: var(--szan-font-mono);
  font-size: var(--szan-text-xs);
  color: var(--szan-text-quaternary);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.szan-comment__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--szan-space-2);
  margin-bottom: var(--szan-space-1);
}

.szan-comment__author {
  font-size: var(--szan-text-md);
  font-weight: 600;
  color: var(--szan-text-primary);
}

.szan-comment__text {
  line-height: var(--szan-leading-snug);
  color: var(--szan-text-secondary);
  white-space: pre-wrap;
  text-wrap: pretty;
}

/* A comment in the panel list is an entry, not the comment itself — clicking it
   opens the thread on the page, the same as an annotation card. So it stays
   clamped whether or not it is the selected one. */
.szan-comment--clickable .szan-comment__text {
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
}

.szan-comment--clickable .szan-comment__reply-text {
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.szan-comment--active {
  border-color: var(--szan-text-feedback);
  background: var(--szan-bg-secondary);
}

.szan-comment__time {
  margin-top: var(--szan-space-1);
  font-size: var(--szan-text-2xs);
  color: var(--szan-text-quaternary);
  font-variant-numeric: tabular-nums;
}

.szan-comment__foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--szan-space-2);
  margin-top: var(--szan-space-1-5);
  font-size: var(--szan-text-xs);
  color: var(--szan-text-quaternary);
}

.szan-comment__reply {
  margin-top: var(--szan-space-1-5);
  padding: var(--szan-space-2) var(--szan-space-3);
  border-left: 3px solid var(--szan-border-primary);
  border-radius: var(--szan-radius-sm);
  background: var(--szan-bg-secondary);
  font-size: var(--szan-text-sm);
  line-height: var(--szan-leading-snug);
  color: var(--szan-text-secondary);
  white-space: pre-wrap;
}

.szan-comment__reply-label {
  display: block;
  margin-bottom: var(--szan-space-0-5);
  font-size: var(--szan-text-xs);
  font-weight: 600;
  color: var(--szan-text-quaternary);
}
`;

// ── Form ─────────────────────────────────────────────────────────────────────

const FORM = `
.szan-form {
  display: flex;
  flex-direction: column;
  gap: var(--szan-space-2);
  margin-top: var(--szan-space-3);
}

/* Untitled UI's input shell: rounded-lg, shadow-xs and a 1px inset ring rather
   than a border, so the focus state can thicken the ring without shifting layout. */
.szan-input {
  width: 100%;
  /* Untitled UI's md field is 40px; their padding lands there because their
     text-md is 16px, ours is 14px. */
  min-height: 40px;
  padding: var(--szan-space-2) var(--szan-space-3);
  border: 0;
  border-radius: var(--szan-radius-lg);
  background: var(--szan-bg-primary);
  color: var(--szan-text-primary);
  font-size: var(--szan-text-md);
  box-shadow:
    inset 0 0 0 1px var(--szan-border-input),
    var(--szan-shadow-xs);
  transition: box-shadow var(--szan-duration-fast) linear;
}

.szan-input::placeholder {
  color: var(--szan-text-quaternary);
}

/* border-brand, not bg-brand-solid: the solid is the raw accent colour, and a
   dark accent on a dark surface is an invisible focus ring. The border variant is
   lightened in the dark theme. */
.szan-input:focus {
  box-shadow:
    inset 0 0 0 2px var(--szan-border-brand),
    var(--szan-shadow-xs);
}

.szan-input[aria-invalid="true"] {
  box-shadow:
    inset 0 0 0 1px var(--szan-text-error-primary),
    var(--szan-shadow-xs);
}

.szan-input[aria-invalid="true"]:focus {
  box-shadow:
    inset 0 0 0 2px var(--szan-text-error-primary),
    var(--szan-shadow-xs);
}

.szan-textarea {
  resize: vertical;
  min-height: 80px;
  line-height: var(--szan-leading-snug);
}

.szan-error {
  display: flex;
  align-items: center;
  gap: var(--szan-space-1-5);
  font-size: var(--szan-text-xs);
  color: var(--szan-text-error-primary);
}

.szan-button {
  align-self: flex-end;
  padding: var(--szan-space-2) var(--szan-space-4);
  border: 1px solid var(--szan-bg-brand-solid);
  border-radius: var(--szan-radius-md);
  background: var(--szan-bg-brand-solid);
  color: var(--szan-text-primary_on-brand);
  font-size: var(--szan-text-md);
  font-weight: 600;
  box-shadow: var(--szan-shadow-xs);
  transition:
    background-color var(--szan-duration) var(--szan-ease),
    border-color var(--szan-duration) var(--szan-ease),
    transform var(--szan-duration-fast) var(--szan-ease);
}

.szan-button:hover:not(:disabled) {
  background: var(--szan-bg-brand-solid_hover);
  border-color: var(--szan-bg-brand-solid_hover);
}

.szan-button:active:not(:disabled) {
  transform: scale(0.96);
}

.szan-button:disabled {
  border-color: var(--szan-bg-disabled);
  background: var(--szan-bg-disabled);
  color: var(--szan-text-disabled);
  box-shadow: none;
}
`;

// ── Overlays drawn over host elements ────────────────────────────────────────

const OVERLAYS = `
.szan-overlay {
  position: fixed;
  z-index: calc(var(--szan-z-base) + var(--szan-z-overlay));
  border: 2px solid var(--szan-bg-feedback-solid);
  border-radius: var(--szan-radius-sm);
  background: var(--szan-overlay-fill);
  pointer-events: none;
  transition:
    top var(--szan-duration-fast) var(--szan-ease),
    left var(--szan-duration-fast) var(--szan-ease),
    width var(--szan-duration-fast) var(--szan-ease),
    height var(--szan-duration-fast) var(--szan-ease);
}

.szan-overlay--selected {
  background: var(--szan-overlay-fill-strong);
  transition: none;
}

.szan-highlight {
  position: fixed;
  z-index: calc(var(--szan-z-base) + var(--szan-z-highlight));
  border: 2px solid var(--szan-bg-feedback-solid);
  border-radius: var(--szan-radius-md);
  background: var(--szan-overlay-fill-strong);
  box-shadow: 0 0 0 4px var(--szan-overlay-ring);
  opacity: 1;
  pointer-events: none;
  transition: opacity var(--szan-duration-slow) var(--szan-ease);
}

.szan-highlight--hover {
  background: var(--szan-overlay-fill);
  box-shadow: none;
}

.szan-highlight--leaving {
  opacity: 0;
}
`;

export const RULES_CSS = [
  BASE,
  TYPE_BRIDGE,
  STATUS_BRIDGE,
  FAB,
  MARKER,
  POPOVER,
  BADGES,
  PANEL,
  CARD,
  COMMENTS,
  FORM,
  OVERLAYS,
].join("\n");

import type { MarkerPosition } from "../types";

/** Visible badge diameter — see `.orbit-marker` in src/styles/rules.ts. */
export const BADGE_SIZE = 28;

/** How far a badge hangs over the corner of the element it marks. */
export const BADGE_OFFSET = 10;

/**
 * Distance between an annotation badge and the feedback badge beside it. Wide
 * enough that the 40px hit areas (the badge plus its 6px pseudo-element) of two
 * interactive badges never touch.
 */
export const BADGE_GAP = BADGE_SIZE + 14;

/**
 * How tall a popover may get before it starts scrolling. Generous on purpose: an
 * annotation plus a comment thread plus the submit form runs to roughly 600px, and
 * a scrollbar inside a popover is worse than a tall popover. The real cap is the
 * viewport — popover-position.ts clamps to the space that is actually there.
 */
export const POPOVER_MAX_HEIGHT = 720;

/** Inset of the column of unplaced badges from the top-left of the viewport. */
export const UNPLACED_INSET = 16;

// Same spacing as BADGE_GAP, for the same reason: 28px badges with a 6px hit-area
// ring need 40px of clearance or two neighbours become one ambiguous target.
const UNPLACED_STEP = BADGE_GAP;

/**
 * Where a badge goes when its annotation has no element on the page — a `global`
 * target, or an element that is not rendered right now. They stack down the
 * left edge so every annotation is reachable from the interface rather than only
 * from the panel. Returns the same shape as getBoundingClientRect so the popover
 * positioning can anchor to it.
 */
export function unplacedBadgeRect(index: number): DOMRect {
  const left = UNPLACED_INSET;
  const top = UNPLACED_INSET + index * UNPLACED_STEP;

  return {
    x: left,
    y: top,
    left,
    top,
    right: left + BADGE_SIZE,
    bottom: top + BADGE_SIZE,
    width: BADGE_SIZE,
    height: BADGE_SIZE,
    toJSON: () => ({}),
  } as DOMRect;
}

/** Corner placement for a badge inside an AnnotationMarker wrapper. */
export const MARKER_CORNERS: Record<MarkerPosition, React.CSSProperties> = {
  "top-right": { top: -BADGE_OFFSET, right: -BADGE_OFFSET },
  "top-left": { top: -BADGE_OFFSET, left: -BADGE_OFFSET },
  "bottom-right": { bottom: -BADGE_OFFSET, right: -BADGE_OFFSET },
  "bottom-left": { bottom: -BADGE_OFFSET, left: -BADGE_OFFSET },
};

/** The same corner, shifted sideways to make room for the annotation badge. */
export function feedbackCorner(position: MarkerPosition): React.CSSProperties {
  const base = MARKER_CORNERS[position];
  return position.includes("right")
    ? { ...base, right: -BADGE_OFFSET + BADGE_GAP }
    : { ...base, left: -BADGE_OFFSET + BADGE_GAP };
}

import { useEffect, useLayoutEffect } from "react";
import { CURSOR_ATTR, CURSOR_CSS, SHEET_CSS, STYLE_ATTR } from "./sheet";

// useLayoutEffect warns during server rendering; the components all guard on a
// `mounted` flag anyway, so falling back to useEffect there is safe.
const useIsomorphicLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

let refCount = 0;
let sheet: HTMLStyleElement | null = null;

function mountSheet(): void {
  if (typeof document === "undefined") return;
  refCount += 1;
  if (sheet) return;

  // A second copy of the package (a duplicated dependency, say) would otherwise
  // inject its own sheet on top of ours.
  const existing = document.querySelector<HTMLStyleElement>(`style[${STYLE_ATTR}]`);
  if (existing) {
    sheet = existing;
    return;
  }

  sheet = document.createElement("style");
  sheet.setAttribute(STYLE_ATTR, "");
  sheet.textContent = SHEET_CSS;
  document.head.appendChild(sheet);
}

function unmountSheet(): void {
  refCount = Math.max(0, refCount - 1);
  if (refCount > 0 || !sheet) return;
  sheet.remove();
  sheet = null;
}

/**
 * Injects the module stylesheet once, no matter how many components ask for it.
 * Every exported component calls this, because `useAnnotationsSafe()` lets them be
 * used without an AnnotationProvider around them.
 */
export function useAnnotationStyles(): void {
  useIsomorphicLayoutEffect(() => {
    mountSheet();
    return unmountSheet;
  }, []);
}

/** Turns the whole page's cursor into a crosshair while the inspector is picking. */
export function useInspectorCursor(active: boolean): void {
  useEffect(() => {
    if (!active || typeof document === "undefined") return;

    const style = document.createElement("style");
    style.setAttribute(CURSOR_ATTR, "");
    style.textContent = CURSOR_CSS;
    document.head.appendChild(style);
    return () => style.remove();
  }, [active]);
}

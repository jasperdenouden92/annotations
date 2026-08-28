/**
 * Finds a DOM element by the annotationId stored in a comment.
 * The Inspector stores either:
 * - An element `id` attribute
 * - A `data-annotation-id` attribute
 * - A generated label like "tag: text" (best-effort match)
 */
export function findElementByAnnotationId(annotationId: string): HTMLElement | null {
  // Try by element id
  const byId = document.getElementById(annotationId);
  if (byId) return byId;

  // Try by data-annotation-id
  const byData = document.querySelector<HTMLElement>(
    `[data-annotation-id="${CSS.escape(annotationId)}"]`
  );
  if (byData) return byData;

  // Try as CSS selector path (e.g. "#root > div > section:nth-of-type(2) > button")
  if (annotationId.includes(">") || annotationId.includes(":nth-of-type")) {
    try {
      const bySelector = document.querySelector<HTMLElement>(annotationId);
      if (bySelector) return bySelector;
    } catch {
      // Invalid selector — ignore
    }
  }

  return null;
}

const HOVER_ATTR = "data-szan-hover-highlight";
let hoverDispose: (() => void) | null = null;
const HIGHLIGHT_PADDING = 4;
const FLASH_DURATION = 2000;
const FADE_DURATION = 200; // must match --szan-duration-slow

/**
 * Draws a box over a host element. The overlay is a real DOM node in the host page
 * rather than a React element, because it has to sit over content this module does
 * not render — so it carries `.szan-root` and picks up the same tokens.
 */
function createOverlay(el: HTMLElement, className: string): {
  overlay: HTMLElement;
  dispose: () => void;
} {
  const overlay = document.createElement("div");
  overlay.className = `szan-root ${className}`;

  const position = () => {
    const rect = el.getBoundingClientRect();
    overlay.style.left = `${rect.left - HIGHLIGHT_PADDING}px`;
    overlay.style.top = `${rect.top - HIGHLIGHT_PADDING}px`;
    overlay.style.width = `${rect.width + HIGHLIGHT_PADDING * 2}px`;
    overlay.style.height = `${rect.height + HIGHLIGHT_PADDING * 2}px`;
  };

  position();
  document.body.appendChild(overlay);
  window.addEventListener("scroll", position, true);
  window.addEventListener("resize", position);

  return {
    overlay,
    dispose: () => {
      overlay.remove();
      window.removeEventListener("scroll", position, true);
      window.removeEventListener("resize", position);
    },
  };
}

/** Scrolls to an element and flashes a highlight over it. */
export function scrollToAndHighlight(el: HTMLElement): void {
  el.scrollIntoView({ behavior: "smooth", block: "center" });

  const { overlay, dispose } = createOverlay(el, "szan-highlight");

  window.setTimeout(() => {
    overlay.classList.add("szan-highlight--leaving");
    window.setTimeout(dispose, FADE_DURATION + 100);
  }, FLASH_DURATION);
}

/** Shows a hover highlight over an element. Returns a cleanup function. */
export function showHoverHighlight(el: HTMLElement): () => void {
  removeHoverHighlight();

  const { overlay, dispose } = createOverlay(el, "szan-highlight szan-highlight--hover");
  overlay.setAttribute(HOVER_ATTR, "");
  hoverDispose = dispose;

  return () => {
    if (hoverDispose === dispose) hoverDispose = null;
    dispose();
  };
}

export function removeHoverHighlight(): void {
  hoverDispose?.();
  hoverDispose = null;
  // Belt and braces: an overlay left behind by an unmount that missed its cleanup.
  document.querySelectorAll(`[${HOVER_ATTR}]`).forEach((el) => el.remove());
}

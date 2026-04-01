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

/**
 * Scrolls to an element and briefly highlights it with a blue outline.
 */
export function scrollToAndHighlight(el: HTMLElement, zIndex: number): void {
  el.scrollIntoView({ behavior: "smooth", block: "center" });

  // Create highlight overlay
  const overlay = document.createElement("div");
  overlay.setAttribute("data-feedback-highlight", "");
  const rect = el.getBoundingClientRect();
  Object.assign(overlay.style, {
    position: "fixed",
    left: `${rect.left - 4}px`,
    top: `${rect.top - 4}px`,
    width: `${rect.width + 8}px`,
    height: `${rect.height + 8}px`,
    border: "2px solid #175CD3",
    borderRadius: "6px",
    background: "rgba(23, 92, 211, 0.08)",
    boxShadow: "0 0 0 4px rgba(23, 92, 211, 0.13)",
    pointerEvents: "none",
    zIndex: String(zIndex + 45),
    transition: "opacity 0.3s ease",
    opacity: "1",
  });
  document.body.appendChild(overlay);

  // Update position on scroll (in case smooth scroll is still animating)
  const updatePos = () => {
    const r = el.getBoundingClientRect();
    overlay.style.left = `${r.left - 4}px`;
    overlay.style.top = `${r.top - 4}px`;
    overlay.style.width = `${r.width + 8}px`;
    overlay.style.height = `${r.height + 8}px`;
  };
  const scrollHandler = () => updatePos();
  window.addEventListener("scroll", scrollHandler, true);

  // Fade out and remove after 2s
  setTimeout(() => {
    overlay.style.opacity = "0";
    setTimeout(() => {
      overlay.remove();
      window.removeEventListener("scroll", scrollHandler, true);
    }, 300);
  }, 2000);
}

const HOVER_ATTR = "data-feedback-hover-highlight";

/**
 * Shows a hover highlight overlay on an element. Returns a cleanup function.
 */
export function showHoverHighlight(el: HTMLElement, zIndex: number): () => void {
  // Remove any existing hover highlight
  removeHoverHighlight();

  const overlay = document.createElement("div");
  overlay.setAttribute(HOVER_ATTR, "");
  const rect = el.getBoundingClientRect();
  Object.assign(overlay.style, {
    position: "fixed",
    left: `${rect.left - 4}px`,
    top: `${rect.top - 4}px`,
    width: `${rect.width + 8}px`,
    height: `${rect.height + 8}px`,
    border: "2px solid #175CD3",
    borderRadius: "6px",
    background: "rgba(23, 92, 211, 0.06)",
    pointerEvents: "none",
    zIndex: String(zIndex + 45),
    transition: "all 0.1s ease",
  });
  document.body.appendChild(overlay);

  const updatePos = () => {
    const r = el.getBoundingClientRect();
    overlay.style.left = `${r.left - 4}px`;
    overlay.style.top = `${r.top - 4}px`;
    overlay.style.width = `${r.width + 8}px`;
    overlay.style.height = `${r.height + 8}px`;
  };
  window.addEventListener("scroll", updatePos, true);

  return () => {
    overlay.remove();
    window.removeEventListener("scroll", updatePos, true);
  };
}

export function removeHoverHighlight(): void {
  document.querySelectorAll(`[${HOVER_ATTR}]`).forEach((el) => el.remove());
}

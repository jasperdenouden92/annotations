/**
 * Generates a stable, human-readable CSS-path identifier for a DOM element.
 * Used by the Inspector to identify which element a comment belongs to.
 */
export function getElementPath(el: HTMLElement): string {
  const parts: string[] = [];
  let current: HTMLElement | null = el;

  while (current && current !== document.body && current !== document.documentElement) {
    let selector = current.tagName.toLowerCase();

    if (current.id) {
      parts.unshift(`#${CSS.escape(current.id)}`);
      break;
    }

    const parent = current.parentElement;
    if (parent) {
      const siblings = Array.from(parent.children).filter(
        (c) => c.tagName === current!.tagName
      );
      if (siblings.length > 1) {
        const index = siblings.indexOf(current) + 1;
        selector += `:nth-of-type(${index})`;
      }
    }

    parts.unshift(selector);
    current = current.parentElement;
  }

  return parts.join(" > ");
}

/**
 * Generates a short label for the element (tag + text preview).
 */
export function getElementLabel(el: HTMLElement): string {
  const tag = el.tagName.toLowerCase();
  const text = (el.textContent ?? "").trim().slice(0, 40);
  if (text) return `<${tag}> ${text}${(el.textContent ?? "").trim().length > 40 ? "…" : ""}`;
  return `<${tag}>`;
}

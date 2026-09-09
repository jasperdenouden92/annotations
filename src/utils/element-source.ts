/**
 * Resolves the React component name and source location of a DOM element.
 *
 * Two sources, in order of reliability:
 *   1. `data-orbit-source` / `data-orbit-component` attributes injected at build
 *      time by the Babel plugin (`@jasperdenouden92/annotations/babel`). Works on
 *      React 17/18/19 and yields both the file:line and the component name.
 *   2. A React fiber walk as a fallback, which yields the component name only.
 *      Reads the `__reactFiber$*` key React attaches to DOM nodes and walks up
 *      the fiber tree to the nearest function/class component.
 *
 * Everything is wrapped in try/catch and only runs when a client clicks an
 * element in the Inspector, so it has zero cost otherwise. In production builds
 * without the Babel plugin, the attributes are absent and only the (possibly
 * minified) component name from the fiber walk is returned.
 */
export interface ElementSource {
  component?: string;
  bron?: string;
}

export function getElementSource(el: HTMLElement): ElementSource {
  const result: ElementSource = {};

  try {
    const sourced = el.closest<HTMLElement>("[data-orbit-source]");
    if (sourced) {
      const bron = sourced.getAttribute("data-orbit-source");
      if (bron) result.bron = bron;
      const component = sourced.getAttribute("data-orbit-component");
      if (component) result.component = component;
    }
  } catch {
    // ignore — attribute lookup is best-effort
  }

  // Fill in the component name from the fiber tree if the plugin wasn't used.
  if (!result.component) {
    try {
      const name = getComponentNameFromFiber(el);
      if (name) result.component = name;
    } catch {
      // ignore — fiber internals are not guaranteed to exist
    }
  }

  return result;
}

function getComponentNameFromFiber(el: HTMLElement): string | undefined {
  const key = Object.keys(el).find(
    (k) => k.startsWith("__reactFiber$") || k.startsWith("__reactInternalInstance$")
  );
  if (!key) return undefined;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let fiber: any = (el as any)[key];
  while (fiber) {
    const type = fiber.type;
    if (typeof type === "function") {
      const name = type.displayName || type.name;
      if (name && name !== "Unknown") return name;
    }
    fiber = fiber.return;
  }
  return undefined;
}

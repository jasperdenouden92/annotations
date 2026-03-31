/**
 * Match a route pattern against a path.
 * Supports :param wildcards (e.g. "/projects/:id/details").
 * "global" matches everything.
 */
export function matchRoute(pattern: string, path: string): boolean {
  if (pattern === "global") return true;

  const normalize = (s: string) => s.replace(/^\/|\/$/g, "");
  const patternParts = normalize(pattern).split("/");
  const pathParts = normalize(path).split("/");

  if (patternParts.length !== pathParts.length) return false;

  return patternParts.every(
    (seg, i) => seg.startsWith(":") || seg === pathParts[i]
  );
}

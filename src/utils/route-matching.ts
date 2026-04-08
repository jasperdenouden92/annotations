/**
 * Match a route pattern against a path.
 * Supports :param wildcards (e.g. "/projects/:id/details").
 * Supports query-parameter-based routing (e.g. "?panel=kpi_analysis").
 * "global" matches everything.
 */
export function matchRoute(pattern: string, path: string): boolean {
  if (pattern === "global") return true;

  // Split off query strings
  const [patternPath, patternSearch] = pattern.split("?");
  const [routePath, routeSearch] = path.split("?");

  // Match path segments (skip if both are empty/root)
  const normalize = (s: string) => s.replace(/^\/|\/$/g, "");
  const normalizedPattern = normalize(patternPath);
  const normalizedRoute = normalize(routePath);

  if (normalizedPattern || normalizedRoute) {
    const patternParts = normalizedPattern.split("/").filter(Boolean);
    const pathParts = normalizedRoute.split("/").filter(Boolean);

    if (patternParts.length !== pathParts.length) return false;

    const pathMatch = patternParts.every(
      (seg, i) => seg.startsWith(":") || seg === pathParts[i]
    );
    if (!pathMatch) return false;
  }

  // If the pattern has query params, check that all pattern params exist in the path
  if (patternSearch) {
    if (!routeSearch) return false;
    const patternParams = new URLSearchParams(patternSearch);
    const routeParams = new URLSearchParams(routeSearch);

    for (const [key, value] of patternParams) {
      // :param wildcard in query value
      if (value.startsWith(":")) continue;
      if (routeParams.get(key) !== value) return false;
    }
  }

  return true;
}

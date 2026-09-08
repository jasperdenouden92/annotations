/** Small presentational formatters shared by the comment components. */

/** Up to two uppercase initials from a name, for an avatar monogram. */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * A short relative time — "nu", "5m", "3u", "2d" — falling back to a date once a
 * comment is older than a week, and to the raw string if it will not parse.
 */
export function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return iso;

  const seconds = Math.round((Date.now() - then) / 1000);
  if (seconds < 45) return "nu";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}u`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d`;

  try {
    return new Date(iso).toLocaleDateString("nl-NL", { day: "numeric", month: "short" });
  } catch {
    return iso;
  }
}

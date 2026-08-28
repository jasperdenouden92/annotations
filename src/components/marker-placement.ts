import { findElementByAnnotationId } from "../utils/find-element";
import { matchRoute } from "../utils/route-matching";
import type { Annotation } from "../types";

/**
 * The annotations that end up in the unplaced column, in the order they get a slot.
 *
 * Two components draw into that column — AutoAnnotationMarkers for annotations and
 * FeedbackMarkers for comments whose element is gone — and they have to agree about
 * who sits where. This is the one place that decides.
 */
export function unplacedAnnotationIds(
  annotations: Annotation[],
  registeredMarkerIds: Set<string>,
  currentRoute: string
): string[] {
  const ids: string[] = [];

  for (const annotation of annotations) {
    if (registeredMarkerIds.has(annotation.id)) continue;
    if (annotation.target !== "global" && !matchRoute(annotation.target, currentRoute)) {
      continue;
    }
    if (findElementByAnnotationId(annotation.elementId || annotation.id)) continue;
    ids.push(annotation.id);
  }

  return ids;
}

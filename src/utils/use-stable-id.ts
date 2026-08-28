import { useRef } from "react";

let counter = 0;

/**
 * A DOM id that stays put across renders, for wiring a label to its field.
 *
 * React 18's `useId` would do this, but the package supports React 17. Every
 * component here waits for a `mounted` flag before rendering, so these ids never
 * reach the server and cannot cause a hydration mismatch.
 */
export function useStableId(prefix: string): string {
  const ref = useRef<string>();
  if (!ref.current) {
    counter += 1;
    ref.current = `${prefix}-${counter}`;
  }
  return ref.current;
}

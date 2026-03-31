import type { PanelCorner } from "../types";

export function snapToCorner(
  x: number,
  y: number,
  windowWidth: number,
  windowHeight: number
): PanelCorner {
  const isRight = x > windowWidth / 2;
  const isBottom = y > windowHeight / 2;

  if (isBottom && isRight) return "bottom-right";
  if (isBottom && !isRight) return "bottom-left";
  if (!isBottom && isRight) return "top-right";
  return "top-left";
}

export function getCornerPosition(
  corner: PanelCorner,
  panelWidth: number,
  panelHeight: number,
  inset = 16
): React.CSSProperties {
  const styles: React.CSSProperties = { position: "fixed" };

  if (corner.includes("top")) styles.top = inset;
  else styles.bottom = inset;

  if (corner.includes("right")) styles.right = inset;
  else styles.left = inset;

  return styles;
}

export function getButtonPosition(
  panelCorner: PanelCorner,
  inset = 24
): React.CSSProperties {
  const styles: React.CSSProperties = { position: "fixed" };

  if (panelCorner.includes("bottom")) styles.bottom = inset;
  else styles.top = inset;

  if (panelCorner.includes("right")) styles.right = inset;
  else styles.left = inset;

  return styles;
}

import type { PanelCorner } from "../types";

export function snapToCorner(
  x: number,
  y: number,
  windowWidth: number,
  windowHeight: number
): PanelCorner {
  // Divide viewport into a 3×3 grid and map to 7 positions
  const col = x < windowWidth / 3 ? "left" : x > (windowWidth * 2) / 3 ? "right" : "center";
  const row = y < windowHeight / 3 ? "top" : y > (windowHeight * 2) / 3 ? "bottom" : "center";

  if (row === "top" && col === "left") return "top-left";
  if (row === "top") return "top-right";
  if (row === "center" && col === "right") return "right-center";
  if (row === "center" && col === "left") return "left-center";
  if (row === "bottom" && col === "right") return "bottom-right";
  if (row === "bottom" && col === "left") return "bottom-left";
  // bottom-center or center-center
  return "bottom-center";
}

export function getCornerPosition(
  corner: PanelCorner,
  panelWidth: number,
  panelHeight: number,
  inset = 16
): React.CSSProperties {
  const styles: React.CSSProperties = { position: "fixed" };

  switch (corner) {
    case "top-left":
      styles.top = inset;
      styles.left = inset;
      break;
    case "top-right":
      styles.top = inset;
      styles.right = inset;
      break;
    case "right-center":
      styles.top = `calc(50% - ${panelHeight / 2}px)`;
      styles.right = inset;
      break;
    case "bottom-right":
      styles.bottom = inset;
      styles.right = inset;
      break;
    case "bottom-center":
      styles.bottom = inset;
      styles.left = `calc(50% - ${panelWidth / 2}px)`;
      break;
    case "bottom-left":
      styles.bottom = inset;
      styles.left = inset;
      break;
    case "left-center":
      styles.top = `calc(50% - ${panelHeight / 2}px)`;
      styles.left = inset;
      break;
  }

  return styles;
}

export function getButtonPosition(
  panelCorner: PanelCorner,
  inset = 24
): React.CSSProperties {
  const styles: React.CSSProperties = { position: "fixed" };

  switch (panelCorner) {
    case "top-left":
      styles.top = inset;
      styles.left = inset;
      break;
    case "top-right":
      styles.top = inset;
      styles.right = inset;
      break;
    case "right-center":
      styles.top = "calc(50% + 4px)"; // below center, 8px gap to inspector above
      styles.right = inset;
      break;
    case "bottom-right":
      styles.bottom = inset;
      styles.right = inset;
      break;
    case "bottom-center":
      styles.bottom = inset;
      styles.left = "calc(50% - 24px)"; // 24px = half of 48px (button + gap)
      break;
    case "bottom-left":
      styles.bottom = inset;
      styles.left = inset;
      break;
    case "left-center":
      styles.top = "calc(50% + 4px)"; // below center, 8px gap to inspector above
      styles.left = inset;
      break;
  }

  return styles;
}

/**
 * Returns the position for the inspector button relative to the annotation button.
 * Places it adjacent to the annotation button in the appropriate direction.
 */
export function getInspectorButtonPosition(
  panelCorner: PanelCorner,
  inset = 24
): React.CSSProperties {
  const styles: React.CSSProperties = { position: "fixed" };
  const offset = 48; // 40px button + 8px gap

  switch (panelCorner) {
    case "top-left":
      styles.top = inset;
      styles.left = inset + offset;
      break;
    case "top-right":
      styles.top = inset;
      styles.right = inset + offset;
      break;
    case "right-center":
      styles.top = "calc(50% - 44px)"; // above annotation button
      styles.right = inset;
      break;
    case "bottom-right":
      styles.bottom = inset + offset;
      styles.right = inset;
      break;
    case "bottom-center":
      styles.bottom = inset;
      styles.left = "calc(50% + 24px)"; // next to annotation button
      break;
    case "bottom-left":
      styles.bottom = inset + offset;
      styles.left = inset;
      break;
    case "left-center":
      styles.top = "calc(50% - 44px)"; // above annotation button
      styles.left = inset;
      break;
  }

  return styles;
}

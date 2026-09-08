import React from "react";
import { TYPE_ICONS } from "../constants";
import type { AnnotationType } from "../types";

interface TypeBadgeProps {
  type: AnnotationType;
}

/**
 * The type label on an annotation. It carries an icon and the type name, so the
 * category never rests on colour alone.
 */
export function TypeBadge({ type }: TypeBadgeProps) {
  const Icon = TYPE_ICONS[type];

  return React.createElement(
    "span",
    { className: "orbit-type-badge", "data-orbit-type": type },
    React.createElement(Icon, { size: 12 }),
    type
  );
}

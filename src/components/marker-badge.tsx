import React from "react";
import { cx } from "../utils/cx";
import { TYPE_ICONS } from "../constants";
import { MessageSquareTextIcon } from "../icons";
import type { AnnotationType } from "../types";

interface MarkerBadgeProps {
  /** An annotation marker takes the colour of its type; a feedback marker is blue. */
  variant: "annotation" | "feedback";
  type?: AnnotationType;
  /** Feedback only: every comment on this element is resolved. */
  resolved?: boolean;
  /** Shown instead of the icon. */
  count?: number;
  /** The accessible name. Required — a coloured circle says nothing on its own. */
  label: string;
  placement: "fixed" | "absolute";
  /** Runtime coordinates only. Everything else belongs in the stylesheet. */
  style?: React.CSSProperties;
  active?: boolean;
  /** Sits one layer below the annotation marker it is paired with. */
  behind?: boolean;
  /** Not attached to an element — drawn with a dashed edge to say so. */
  unplaced?: boolean;
  controls?: string;
  onClick?: (event: React.MouseEvent) => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

/**
 * The round badge that sits on an annotated element. One implementation for all
 * three places it appears: the AnnotationMarker wrapper, the auto-discovered
 * markers, and the standalone feedback markers.
 *
 * Without an `onClick` it renders as a span: a badge that only mirrors what the
 * panel already shows should not be a tab stop.
 */
export function MarkerBadge({
  variant,
  type = "documentation",
  resolved,
  count,
  label,
  placement,
  style,
  active,
  behind,
  unplaced,
  controls,
  onClick,
  onMouseEnter,
  onMouseLeave,
}: MarkerBadgeProps) {
  const interactive = !!onClick;
  const Icon = variant === "feedback" ? MessageSquareTextIcon : TYPE_ICONS[type];

  const className = cx(
    "szan-root",
    "szan-marker",
    placement === "fixed" ? "szan-marker--fixed" : "szan-marker--absolute",
    variant === "feedback" && "szan-marker--feedback",
    resolved && "szan-marker--resolved",
    active && "szan-marker--active",
    behind && "szan-marker--behind",
    unplaced && "szan-marker--unplaced",
    !interactive && "szan-marker--static"
  );

  const content =
    count !== undefined && count > 0
      ? React.createElement(
          "span",
          { className: "szan-marker__count", "aria-hidden": true },
          count
        )
      : React.createElement(Icon, { size: 14 });

  if (!interactive) {
    return React.createElement(
      "span",
      {
        className,
        style,
        "data-szan-type": variant === "annotation" ? type : undefined,
      },
      React.createElement("span", { className: "szan-sr-only" }, label),
      content
    );
  }

  return React.createElement(
    "button",
    {
      type: "button",
      className,
      style,
      "data-szan-type": variant === "annotation" ? type : undefined,
      "aria-label": label,
      "aria-expanded": controls ? !!active : undefined,
      "aria-controls": controls && active ? controls : undefined,
      onClick,
      onMouseEnter,
      onMouseLeave,
    },
    content
  );
}

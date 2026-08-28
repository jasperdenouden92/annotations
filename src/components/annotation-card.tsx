import React from "react";
import { cx } from "../utils/cx";
import { CrosshairIcon } from "../icons";
import { TypeBadge } from "./type-badge";
import { navigateTo, routeBreadcrumb } from "../utils/route-matching";
import { useStableId } from "../utils/use-stable-id";
import type { Annotation } from "../types";

interface AnnotationCardProps {
  annotation: Annotation;
  /** This annotation's popover is open on the page. */
  isActive: boolean;
  /** Set when the marker for this annotation is hovered out on the page. */
  isHovered: boolean;
  onSelect: () => void;
  onHoverStart: (id: string) => void;
  onHoverEnd: () => void;
}

export function AnnotationCard({
  annotation,
  isActive,
  isHovered,
  onSelect,
  onHoverStart,
  onHoverEnd,
}: AnnotationCardProps) {
  const titleId = useStableId("szan-card-title");
  const type = annotation.type ?? "documentation";
  const hasElement = !!annotation.elementId;
  const breadcrumb = routeBreadcrumb(annotation.target);
  const canNavigate = !!annotation.target && annotation.target !== "global";

  return React.createElement(
    "div",
    {
      className: cx(
        "szan-card",
        isHovered && "szan-card--hovered",
        isActive && "szan-card--active"
      ),
      onMouseEnter: () => onHoverStart(annotation.id),
      onMouseLeave: onHoverEnd,
    },

    // Stretched primary action, so the breadcrumb below can stay its own button.
    // It borrows its name from the visible title rather than repeating it.
    //
    // Clicking opens this annotation's popover on the page, where the body is
    // shown in full. The card itself stays clamped to two lines — it is a list
    // entry, not a second copy of the annotation.
    React.createElement("button", {
      type: "button",
      className: "szan-card__target",
      onClick: onSelect,
      "aria-labelledby": titleId,
      "aria-expanded": isActive,
    }),

    React.createElement(
      "div",
      { className: "szan-card__head" },
      React.createElement(
        "span",
        { className: "szan-card__title", id: titleId },
        annotation.title
      ),
      hasElement &&
        React.createElement(
          "span",
          { className: "szan-card__pin" },
          React.createElement(CrosshairIcon, { size: 12 })
        ),
      React.createElement(TypeBadge, { type })
    ),

    React.createElement("p", { className: "szan-card__body" }, annotation.body),

    React.createElement(
      "div",
      { className: "szan-card__foot" },
      canNavigate
        ? React.createElement(
            "button",
            {
              type: "button",
              className: "szan-link",
              onClick: (e: React.MouseEvent) => {
                e.stopPropagation();
                navigateTo(annotation.target);
              },
            },
            breadcrumb
          )
        : React.createElement("span", { className: "szan-meta" }, breadcrumb),
      React.createElement(
        "span",
        { className: "szan-meta" },
        `${annotation.author} · ${annotation.date}`
      )
    )
  );
}

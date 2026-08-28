import React, { useEffect } from "react";
import { cx } from "../utils/cx";
import { TypeBadge } from "./type-badge";
import { CommentThread } from "./comment-thread";
import { CommentForm } from "./comment-form";
import { MessageSquareTextIcon } from "../icons";
import type { Annotation, Comment } from "../types";

interface AnnotationPopoverProps {
  /** Referenced by the trigger's aria-controls. */
  id: string;
  annotation?: Annotation;
  /** Rendered above the annotation section; the inspector puts its element label here. */
  header?: React.ReactNode;
  showComments: boolean;
  comments: Comment[];
  isLoading: boolean;
  error: string | null;
  onSubmit: (data: { auteur: string; comment: string }) => Promise<void>;
  onClose: () => void;
  /** Runtime placement from popover-position.ts. */
  style?: React.CSSProperties;
  variant?: "marker" | "inspector";
  extraProps?: Record<string, string>;
}

/**
 * The panel that opens off an annotation marker. One implementation for the wrapped
 * markers, the auto-discovered markers and the inspector — they had drifted into
 * three different radii, paddings and shadows for the same thing.
 */
export function AnnotationPopover({
  id,
  annotation,
  header,
  showComments,
  comments,
  isLoading,
  error,
  onSubmit,
  onClose,
  style,
  variant = "marker",
  extraProps,
}: AnnotationPopoverProps) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const type = annotation?.type ?? "documentation";

  return React.createElement(
    "div",
    {
      id,
      className: cx(
        "szan-root",
        "szan-popover",
        "szan-animate-in",
        variant === "inspector" && "szan-popover--inspector"
      ),
      style,
      role: "group",
      "aria-label": annotation ? annotation.title : "Feedback",
      onClick: (e: React.MouseEvent) => e.stopPropagation(),
      ...extraProps,
    },

    header,

    annotation &&
      React.createElement(
        "div",
        { className: "szan-popover__section" },
        React.createElement(TypeBadge, { type }),
        React.createElement("div", { className: "szan-popover__title" }, annotation.title),
        React.createElement("div", { className: "szan-popover__body" }, annotation.body),
        React.createElement(
          "div",
          { className: "szan-popover__meta" },
          `${annotation.author} · ${annotation.date}`
        )
      ),

    showComments &&
      React.createElement(
        "div",
        { className: "szan-popover__section" },
        React.createElement(
          "div",
          { className: "szan-section-heading" },
          React.createElement(MessageSquareTextIcon, { size: 12 }),
          "Feedback",
          comments.length > 0 &&
            React.createElement("span", { className: "szan-count" }, comments.length)
        ),
        React.createElement(CommentThread, { comments, isLoading, error }),
        React.createElement(CommentForm, { onSubmit })
      )
  );
}

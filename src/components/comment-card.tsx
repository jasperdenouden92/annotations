import React from "react";
import { cx } from "../utils/cx";
import { StatusPill } from "./status-pill";
import type { Comment } from "../types";

interface CommentCardProps {
  comment: Comment;
  /** Shows the element reference the comment was left on. */
  showLabel?: boolean;
  footer?: React.ReactNode;
  /**
   * Opens this comment's thread on the page. Leave it out for a thread inside a
   * popover, where the comments are already shown in full.
   */
  onSelect?: () => void;
  isActive?: boolean;
  activateLabel?: string;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

/** One comment, as it appears in a thread and in the panel's feedback list. */
export function CommentCard({
  comment,
  showLabel,
  footer,
  onSelect,
  isActive,
  activateLabel,
  onMouseEnter,
  onMouseLeave,
}: CommentCardProps) {
  return React.createElement(
    "div",
    {
      className: cx(
        "szan-comment",
        onSelect && "szan-comment--clickable",
        isActive && "szan-comment--active"
      ),
      onMouseEnter,
      onMouseLeave,
    },

    onSelect &&
      React.createElement(
        "button",
        {
          type: "button",
          className: "szan-comment__target",
          onClick: onSelect,
          "aria-expanded": !!isActive,
        },
        React.createElement(
          "span",
          { className: "szan-sr-only" },
          activateLabel ?? `Feedback van ${comment.auteur}`
        )
      ),

    showLabel &&
      comment.label &&
      React.createElement("div", { className: "szan-comment__label" }, comment.label),

    React.createElement(
      "div",
      { className: "szan-comment__head" },
      React.createElement("span", { className: "szan-comment__author" }, comment.auteur),
      React.createElement(StatusPill, { status: comment.status })
    ),

    React.createElement("div", { className: "szan-comment__text" }, comment.comment),

    comment.antwoord
      ? React.createElement(
          "div",
          { className: "szan-comment__reply" },
          React.createElement(
            "span",
            { className: "szan-comment__reply-label" },
            "Antwoord"
          ),
          React.createElement(
            "span",
            { className: "szan-comment__reply-text" },
            comment.antwoord
          )
        )
      : null,

    footer
  );
}

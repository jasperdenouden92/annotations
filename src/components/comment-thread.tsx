import React, { useState, useEffect } from "react";
import { useAnnotationStyles } from "../styles/inject";
import { CommentCard } from "./comment-card";
import type { Comment } from "../types";

interface CommentThreadProps {
  comments: Comment[];
  isLoading: boolean;
  error: string | null;
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString("nl-NL", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
}

export function CommentThread({ comments, isLoading, error }: CommentThreadProps) {
  useAnnotationStyles();

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  if (comments.length === 0) {
    const [message, isError] = isLoading
      ? ["Comments laden...", false]
      : error
        ? ["Fout bij laden comments", true]
        : ["Nog geen comments", false];

    // role changes with the message so a failure interrupts and a status does not.
    return React.createElement(
      "div",
      {
        className: isError ? "szan-root szan-empty szan-empty--error" : "szan-root szan-empty",
        role: isError ? "alert" : "status",
      },
      message
    );
  }

  return React.createElement(
    "div",
    { className: "szan-root szan-thread" },
    ...comments.map((comment) =>
      React.createElement(CommentCard, {
        key: comment.id,
        comment,
        footer: React.createElement(
          "div",
          { className: "szan-comment__time" },
          formatDate(comment.aangemaakt)
        ),
      })
    )
  );
}

import React, { useState, useEffect } from "react";
import type { Comment } from "../types";
import { PANEL_COLORS } from "../constants";

interface CommentThreadProps {
  comments: Comment[];
  isLoading: boolean;
  error: string | null;
}

const STATUS_COLORS: Record<Comment["status"], { bg: string; text: string }> = {
  "Open": { bg: "#FEF3F2", text: "#B42318" },
  "In behandeling": { bg: "#FFF6ED", text: "#B93815" },
  "Opgelost": { bg: "#ECFDF3", text: "#067647" },
};

function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString("nl-NL", {
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
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  if (isLoading && comments.length === 0) {
    return React.createElement(
      "div",
      {
        style: {
          fontSize: 13,
          color: PANEL_COLORS.textMuted,
          padding: "8px 0",
        },
      },
      "Comments laden..."
    );
  }

  if (error && comments.length === 0) {
    return React.createElement(
      "div",
      {
        style: {
          fontSize: 13,
          color: "#B42318",
          padding: "8px 0",
        },
      },
      "Fout bij laden comments"
    );
  }

  if (comments.length === 0) {
    return React.createElement(
      "div",
      {
        style: {
          fontSize: 13,
          color: PANEL_COLORS.textMuted,
          padding: "8px 0",
        },
      },
      "Nog geen comments"
    );
  }

  return React.createElement(
    "div",
    {
      style: {
        display: "flex",
        flexDirection: "column",
        gap: 8,
      } as React.CSSProperties,
    },
    ...comments.map((c) =>
      React.createElement(
        "div",
        {
          key: c.id,
          style: {
            padding: "8px 10px",
            borderRadius: 6,
            border: `1px solid ${PANEL_COLORS.border}`,
            background: "#FFFFFF",
            fontSize: 13,
          } as React.CSSProperties,
        },
        // Header: auteur + status badge
        React.createElement(
          "div",
          {
            style: {
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 4,
            } as React.CSSProperties,
          },
          React.createElement(
            "span",
            {
              style: {
                fontWeight: 600,
                color: PANEL_COLORS.textPrimary,
                fontSize: 13,
              },
            },
            c.auteur
          ),
          React.createElement(
            "span",
            {
              style: {
                fontSize: 11,
                fontWeight: 500,
                padding: "1px 6px",
                borderRadius: 10,
                background: STATUS_COLORS[c.status]?.bg ?? "#F5F5F5",
                color: STATUS_COLORS[c.status]?.text ?? "#344054",
              } as React.CSSProperties,
            },
            c.status
          )
        ),
        // Comment text
        React.createElement(
          "div",
          {
            style: {
              color: PANEL_COLORS.textSecondary,
              lineHeight: 1.4,
              whiteSpace: "pre-wrap",
            } as React.CSSProperties,
          },
          c.comment
        ),
        // Timestamp
        React.createElement(
          "div",
          {
            style: {
              fontSize: 11,
              color: PANEL_COLORS.textMuted,
              marginTop: 4,
            },
          },
          formatDate(c.aangemaakt)
        ),
        // Antwoord (reply) if present
        c.antwoord
          ? React.createElement(
              "div",
              {
                style: {
                  marginTop: 6,
                  padding: "6px 8px",
                  borderRadius: 4,
                  background: "#F9FAFB",
                  borderLeft: "3px solid #D0D5DD",
                  fontSize: 13,
                  color: PANEL_COLORS.textSecondary,
                  lineHeight: 1.4,
                  whiteSpace: "pre-wrap",
                } as React.CSSProperties,
              },
              React.createElement(
                "span",
                {
                  style: {
                    fontWeight: 600,
                    fontSize: 11,
                    color: PANEL_COLORS.textMuted,
                    display: "block",
                    marginBottom: 2,
                  },
                },
                "Antwoord"
              ),
              c.antwoord
            )
          : null
      )
    )
  );
}

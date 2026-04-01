import React from "react";
import type { Annotation } from "../types";
import { CrosshairIcon } from "../icons";
import { PANEL_COLORS, TYPE_COLORS, TYPE_ICONS } from "../constants";

interface AnnotationCardProps {
  annotation: Annotation;
  isActive: boolean;
  isHovered: boolean;
  accentColor: string;
  onSelect: (id: string) => void;
  onHoverStart: (id: string) => void;
  onHoverEnd: () => void;
}

export function AnnotationCard({
  annotation,
  isActive,
  isHovered,
  accentColor,
  onSelect,
  onHoverStart,
  onHoverEnd,
}: AnnotationCardProps) {
  const type = annotation.type ?? "documentation";
  const typeColor = TYPE_COLORS[type];
  const TypeIcon = TYPE_ICONS[type];
  const hasElement = !!annotation.elementId;

  // Build breadcrumb from target
  const breadcrumb = annotation.target
    .replace(/^\//, "")
    .split("/")
    .filter(Boolean);

  return React.createElement(
    "button",
    {
      onClick: () => onSelect(annotation.id),
      onMouseEnter: () => onHoverStart(annotation.id),
      onMouseLeave: onHoverEnd,
      style: {
        display: "block",
        width: "100%",
        textAlign: "left",
        background: isActive
          ? PANEL_COLORS.bgActive
          : isHovered
            ? PANEL_COLORS.bgHover
            : "transparent",
        border: "none",
        borderLeft: isActive ? `3px solid ${accentColor}` : "3px solid transparent",
        borderRadius: 6,
        padding: "10px 12px",
        cursor: hasElement ? "pointer" : "default",
        transition: "background 0.1s ease",
        fontFamily: "inherit",
      } as React.CSSProperties,
    },
    // Header row: title + type badge (right-aligned)
    React.createElement(
      "div",
      {
        style: {
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 4,
        } as React.CSSProperties,
      },
      // Title
      React.createElement(
        "span",
        {
          style: {
            fontSize: 13,
            fontWeight: 600,
            color: PANEL_COLORS.textPrimary,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            flex: 1,
          } as React.CSSProperties,
        },
        annotation.title
      ),
      // MapPin icon
      hasElement &&
        React.createElement(
          "span",
          {
            style: { flexShrink: 0, display: "flex" } as React.CSSProperties,
          },
          React.createElement(CrosshairIcon, { size: 12, color: PANEL_COLORS.textMuted })
        ),
      // Type badge (right)
      React.createElement(
        "span",
        {
          style: {
            display: "flex",
            alignItems: "center",
            gap: 3,
            fontSize: 10,
            fontWeight: 600,
            color: typeColor.text,
            background: typeColor.bg,
            border: `1px solid ${typeColor.border}`,
            borderRadius: 4,
            padding: "1px 6px",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            flexShrink: 0,
          } as React.CSSProperties,
        },
        React.createElement(TypeIcon, { size: 10, color: typeColor.text }),
        type
      )
    ),
    // Body
    React.createElement(
      "p",
      {
        style: {
          fontSize: 12,
          color: PANEL_COLORS.textSecondary,
          margin: "0 0 6px 0",
          lineHeight: 1.5,
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        } as React.CSSProperties,
      },
      annotation.body
    ),
    // Footer: breadcrumb + author + date
    React.createElement(
      "div",
      {
        style: {
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontSize: 11,
          color: PANEL_COLORS.textMuted,
        } as React.CSSProperties,
      },
      // Breadcrumb
      React.createElement(
        "span",
        {
          style: {
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            maxWidth: "60%",
          } as React.CSSProperties,
        },
        breadcrumb.join(" / ") || "global"
      ),
      // Author + date
      React.createElement(
        "span",
        { style: { flexShrink: 0 } as React.CSSProperties },
        `${annotation.author} · ${annotation.date}`
      )
    )
  );
}

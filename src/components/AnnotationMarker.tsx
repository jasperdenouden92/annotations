import React from "react";
import { useAnnotationsSafe } from "../context/useAnnotationsSafe";
import { useComments } from "../hooks/useComments";
import { CommentThread } from "./CommentThread";
import { CommentForm } from "./CommentForm";
import { MessageSquareTextIcon } from "../icons";
import { PANEL_COLORS } from "../constants";
import type { MarkerPosition } from "../types";

interface AnnotationMarkerProps {
  annotationId: string;
  children: React.ReactNode;
  position?: MarkerPosition;
  className?: string;
}

const POSITION_STYLES: Record<MarkerPosition, React.CSSProperties> = {
  "top-right": { top: -6, right: -6 },
  "top-left": { top: -6, left: -6 },
  "bottom-right": { bottom: -6, right: -6 },
  "bottom-left": { bottom: -6, left: -6 },
};

export function AnnotationMarker({
  annotationId,
  children,
  position = "top-right",
  className,
}: AnnotationMarkerProps) {
  const {
    annotationMode,
    activeAnnotationId,
    hoveredAnnotationId,
    setActiveAnnotationId,
    setHoveredAnnotationId,
    setPanelOpen,
    settings,
    commentsConfig,
    allAnnotations,
  } = useAnnotationsSafe();

  if (!annotationMode) {
    return React.createElement(React.Fragment, null, children);
  }

  const isActive = activeAnnotationId === annotationId;
  const isHovered = hoveredAnnotationId === annotationId;
  const accent = settings.accentColor;
  const showComments = !!commentsConfig && isActive;

  const annotationLabel =
    allAnnotations.find((a) => a.id === annotationId)?.title ?? annotationId;

  const { comments, isLoading, error, submitComment } = useComments({
    apiBase: commentsConfig?.apiBase ?? "",
    project: commentsConfig?.project ?? "",
    annotationId,
    label: annotationLabel,
    enabled: showComments,
  });

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveAnnotationId(isActive ? null : annotationId);
    if (!isActive) setPanelOpen(true);
  };

  return React.createElement(
    "div",
    {
      className,
      style: {
        position: "relative",
        display: "contents",
      } as React.CSSProperties,
    },
    // Ring around the content
    React.createElement(
      "div",
      {
        style: {
          position: "relative",
          borderRadius: 6,
          outline: isActive || isHovered
            ? `2px solid ${accent}`
            : "2px solid transparent",
          outlineOffset: 2,
          boxShadow: isActive ? `0 0 0 4px ${accent}33` : "none",
          transition: "outline 0.15s ease, box-shadow 0.15s ease",
        } as React.CSSProperties,
      },
      children,
      // Badge
      React.createElement(
        "button",
        {
          onClick: handleClick,
          onMouseEnter: () => setHoveredAnnotationId(annotationId),
          onMouseLeave: () => setHoveredAnnotationId(null),
          "aria-label": "Toon annotatie",
          style: {
            position: "absolute",
            ...POSITION_STYLES[position],
            zIndex: settings.zIndex + 20,
            width: 24,
            height: 24,
            borderRadius: "50%",
            background: "#FFFFFF",
            color: "#344054",
            border: "1px solid #D0D5DD",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
            transform: isHovered ? "scale(1.1)" : "scale(1)",
            transition: "transform 0.15s ease",
          } as React.CSSProperties,
        },
        React.createElement(MessageSquareTextIcon, { size: 12, color: "#667085" })
      ),
      // Comments popover
      showComments &&
        React.createElement(
          "div",
          {
            style: {
              position: "absolute",
              top: "100%",
              left: 0,
              right: 0,
              minWidth: 280,
              maxWidth: 360,
              marginTop: 8,
              zIndex: settings.zIndex + 30,
              background: PANEL_COLORS.bg,
              border: `1px solid ${PANEL_COLORS.border}`,
              borderRadius: 8,
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              padding: 12,
              maxHeight: 400,
              overflowY: "auto",
            } as React.CSSProperties,
            onClick: (e: React.MouseEvent) => e.stopPropagation(),
          },
          React.createElement(
            "div",
            {
              style: {
                fontWeight: 600,
                fontSize: 13,
                color: PANEL_COLORS.textPrimary,
                marginBottom: 8,
              },
            },
            "Comments"
          ),
          React.createElement(CommentThread, { comments, isLoading, error }),
          React.createElement(CommentForm, { onSubmit: submitComment })
        )
    )
  );
}

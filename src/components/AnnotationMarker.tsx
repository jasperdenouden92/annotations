import React, { useState, useEffect } from "react";
import { useAnnotationsSafe } from "../context/useAnnotationsSafe";
import { useComments } from "../hooks/useComments";
import { CommentThread } from "./CommentThread";
import { CommentForm } from "./CommentForm";
import { MessageSquareTextIcon } from "../icons";
import { PANEL_COLORS, TYPE_COLORS, TYPE_ICONS } from "../constants";
import type { MarkerPosition, Annotation } from "../types";

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
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const {
    annotationMode,
    inspectorActive,
    activeAnnotationId,
    hoveredAnnotationId,
    setActiveAnnotationId,
    setHoveredAnnotationId,
    setPanelOpen,
    settings,
    commentsConfig,
    allAnnotations,
    allComments,
    registerMarkerId,
    unregisterMarkerId,
  } = useAnnotationsSafe();

  // Register this marker so AutoAnnotationMarkers skips it
  useEffect(() => {
    registerMarkerId(annotationId);
    return () => unregisterMarkerId(annotationId);
  }, [annotationId, registerMarkerId, unregisterMarkerId]);

  const isActive = activeAnnotationId === annotationId;
  const showPopover = isActive;
  const matchingAnnotations = allAnnotations.filter((a) => a.id === annotationId);
  const annotation = matchingAnnotations[0] as Annotation | undefined;
  const annotationLabel = annotation?.title ?? annotationId;

  const { comments, isLoading, error, submitComment } = useComments({
    apiBase: commentsConfig?.apiBase ?? "",
    project: commentsConfig?.project ?? "",
    annotationId,
    label: annotationLabel,
    enabled: !!commentsConfig && isActive,
  });

  const showMarkers = mounted && (annotationMode || inspectorActive);
  const isHovered = hoveredAnnotationId === annotationId;
  const annotationType = annotation?.type ?? "documentation";
  const typeColor = TYPE_COLORS[annotationType];
  const TypeIcon = TYPE_ICONS[annotationType];

  // Feedback badge: filter allComments for this annotationId
  const elementComments = commentsConfig
    ? allComments.filter((c) => c.annotationId === annotationId)
    : [];
  const openCommentCount = elementComments.filter((c) => c.status !== "Opgelost").length;
  const hasComments = elementComments.length > 0;
  const allResolved = hasComments && openCommentCount === 0;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveAnnotationId(isActive ? null : annotationId);
    if (!isActive) setPanelOpen(true);
  };

  // Badge content: type icon (single annotation) or counter (multiple)
  const badgeContent = matchingAnnotations.length > 1
    ? React.createElement(
        "span",
        { style: { fontSize: 10, fontWeight: 700, lineHeight: 1 } },
        matchingAnnotations.length
      )
    : React.createElement(TypeIcon, { size: 12, color: typeColor.text });

  return React.createElement(
    "div",
    {
      className,
      style: {
        position: "relative",
        display: "contents",
      } as React.CSSProperties,
    },
    // Ring around the content — always rendered to preserve layout
    React.createElement(
      "div",
      {
        style: {
          position: "relative",
          borderRadius: 6,
          flex: 1,
          minWidth: 0,
          outline: showMarkers && (isActive || isHovered)
            ? `2px solid ${typeColor.text}`
            : "2px solid transparent",
          outlineOffset: 2,
          boxShadow: showMarkers && isActive ? `0 0 0 4px ${typeColor.text}22` : "none",
          transition: "outline 0.15s ease, box-shadow 0.15s ease",
        } as React.CSSProperties,
      },
      children,
      // Badge — only when annotation mode is active
      showMarkers && React.createElement(
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
            background: typeColor.bg,
            color: typeColor.text,
            border: `1.5px solid ${typeColor.border}`,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
            transform: isHovered ? "scale(1.1)" : "scale(1)",
            transition: "transform 0.15s ease",
          } as React.CSSProperties,
        },
        badgeContent
      ),
      // Feedback badge — only when comments exist
      showMarkers && hasComments && React.createElement(
        "div",
        {
          "aria-label": `${openCommentCount} open comments`,
          style: {
            position: "absolute",
            ...POSITION_STYLES[position],
            // Offset horizontally from annotation badge
            ...(position.includes("right")
              ? { right: -6 + 22 }
              : { left: -6 + 22 }),
            zIndex: settings.zIndex + 19,
            width: 24,
            height: 24,
            borderRadius: "50%",
            background: allResolved ? "#F2F4F7" : "#EFF8FF",
            color: allResolved ? "#98A2B3" : "#175CD3",
            border: `1.5px solid ${allResolved ? "#D0D5DD" : "#B2DDFF"}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 1,
            boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
            pointerEvents: "none",
          } as React.CSSProperties,
        },
        openCommentCount > 0
          ? React.createElement(
              "span",
              { style: { fontSize: 10, fontWeight: 700, lineHeight: 1 } },
              openCommentCount
            )
          : React.createElement(MessageSquareTextIcon, {
              size: 12,
              color: allResolved ? "#98A2B3" : "#175CD3",
            })
      ),
      // Popover when active
      showMarkers && showPopover &&
        React.createElement(
          "div",
          {
            style: {
              position: "absolute",
              top: "100%",
              left: 0,
              right: 0,
              minWidth: 300,
              maxWidth: 380,
              marginTop: 8,
              zIndex: settings.zIndex + 30,
              background: PANEL_COLORS.bg,
              border: `1px solid ${PANEL_COLORS.border}`,
              borderRadius: 8,
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              padding: 0,
              maxHeight: 460,
              overflowY: "auto",
            } as React.CSSProperties,
            onClick: (e: React.MouseEvent) => e.stopPropagation(),
          },
          // ── Annotation section ──
          annotation && React.createElement(
            "div",
            {
              style: {
                padding: 12,
                borderBottom: commentsConfig ? `1px solid ${PANEL_COLORS.border}` : undefined,
              } as React.CSSProperties,
            },
            // Type badge + title
            React.createElement(
              "div",
              {
                style: {
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 6,
                } as React.CSSProperties,
              },
              React.createElement(
                "span",
                {
                  style: {
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    fontSize: 10,
                    fontWeight: 600,
                    color: typeColor.text,
                    background: typeColor.bg,
                    border: `1px solid ${typeColor.border}`,
                    borderRadius: 4,
                    padding: "2px 6px",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  } as React.CSSProperties,
                },
                React.createElement(TypeIcon, { size: 10, color: typeColor.text }),
                annotationType
              )
            ),
            // Title
            React.createElement(
              "div",
              {
                style: {
                  fontWeight: 600,
                  fontSize: 14,
                  color: PANEL_COLORS.textPrimary,
                  marginBottom: 4,
                },
              },
              annotation.title
            ),
            // Body
            React.createElement(
              "div",
              {
                style: {
                  fontSize: 13,
                  color: PANEL_COLORS.textSecondary,
                  lineHeight: 1.5,
                  whiteSpace: "pre-wrap",
                },
              },
              annotation.body
            ),
            // Author + date
            React.createElement(
              "div",
              {
                style: {
                  fontSize: 11,
                  color: PANEL_COLORS.textMuted,
                  marginTop: 8,
                },
              },
              `${annotation.author} · ${annotation.date}`
            )
          ),
          // ── Feedback section ──
          commentsConfig && React.createElement(
            "div",
            {
              style: { padding: 12 } as React.CSSProperties,
            },
            React.createElement(
              "div",
              {
                style: {
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  marginBottom: 8,
                  fontSize: 12,
                  fontWeight: 600,
                  color: PANEL_COLORS.textMuted,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                } as React.CSSProperties,
              },
              React.createElement(MessageSquareTextIcon, { size: 12, color: PANEL_COLORS.textMuted }),
              "Feedback",
              comments.length > 0 && React.createElement(
                "span",
                {
                  style: {
                    fontSize: 10,
                    fontWeight: 600,
                    background: "#F2F4F7",
                    color: "#344054",
                    borderRadius: 8,
                    padding: "1px 6px",
                  } as React.CSSProperties,
                },
                comments.length
              )
            ),
            React.createElement(CommentThread, { comments, isLoading, error }),
            React.createElement(CommentForm, { onSubmit: submitComment })
          )
        )
    )
  );
}

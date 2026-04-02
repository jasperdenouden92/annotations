import React, { useState, useEffect, useCallback } from "react";
import { useAnnotationsSafe } from "../context/useAnnotationsSafe";
import { useComments } from "../hooks/useComments";
import { CommentThread } from "./CommentThread";
import { CommentForm } from "./CommentForm";
import { findElementByAnnotationId } from "../utils/find-element";
import { showHoverHighlight, removeHoverHighlight } from "../utils/find-element";
import { MessageSquareTextIcon } from "../icons";
import { PANEL_COLORS, TYPE_COLORS, TYPE_ICONS } from "../constants";
import { getFixedPopoverStyle } from "../utils/popover-position";
import type { Annotation } from "../types";

interface AutoBadgeInfo {
  annotation: Annotation;
  rect: DOMRect;
  openCommentCount: number;
  hasComments: boolean;
  allResolved: boolean;
}

/**
 * Auto-discovers DOM elements with data-annotation-id attributes that match
 * annotations in the config, and renders floating badges for any that are NOT
 * already handled by an explicit <AnnotationMarker> wrapper.
 */
export function AutoAnnotationMarkers() {
  const {
    annotationMode,
    inspectorActive,
    activeAnnotationId,
    hoveredAnnotationId,
    setActiveAnnotationId,
    setHoveredAnnotationId,
    setPanelOpen,
    settings,
    allAnnotations,
    allComments,
    commentsConfig,
    currentRoute,
    registeredMarkerIds,
  } = useAnnotationsSafe();

  const [badges, setBadges] = useState<AutoBadgeInfo[]>([]);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Find the active auto-badge (if any) for popover rendering
  const activeBadge = activeAnnotationId
    ? badges.find((b) => b.annotation.id === activeAnnotationId)
    : undefined;
  const activeAnnotation = activeBadge?.annotation;
  const activeAnnotationLabel = activeAnnotation?.title ?? activeAnnotationId ?? "";

  const { comments, isLoading, error, submitComment } = useComments({
    apiBase: commentsConfig?.apiBase ?? "",
    project: commentsConfig?.project ?? "",
    annotationId: activeAnnotationId ?? "",
    label: activeAnnotationLabel,
    enabled: !!commentsConfig && !!activeBadge,
  });

  const showMarkers = mounted && (annotationMode || inspectorActive);

  const updateBadges = useCallback(() => {
    if (!showMarkers) {
      setBadges([]);
      return;
    }

    const newBadges: AutoBadgeInfo[] = [];

    for (const annotation of allAnnotations) {
      // Skip annotations already handled by an explicit AnnotationMarker
      if (registeredMarkerIds.has(annotation.id)) continue;

      // Skip annotations not targeting the current route
      if (annotation.target !== "global" && annotation.target !== currentRoute) continue;

      // Try to find the element by annotation.elementId or annotation.id
      const lookupId = annotation.elementId || annotation.id;
      const el = findElementByAnnotationId(lookupId);
      if (!el) continue;

      const rect = el.getBoundingClientRect();

      // Compute comment counts for this annotation
      const elementComments = commentsConfig
        ? allComments.filter((c) => c.annotationId === annotation.id)
        : [];
      const openCommentCount = elementComments.filter((c) => c.status !== "Opgelost").length;

      newBadges.push({
        annotation,
        rect,
        openCommentCount,
        hasComments: elementComments.length > 0,
        allResolved: elementComments.length > 0 && openCommentCount === 0,
      });
    }

    // Bail out if badges haven't actually changed to avoid re-render loops
    setBadges((prev) => {
      if (prev.length !== newBadges.length) return newBadges;
      const unchanged = prev.every((b, i) => {
        const n = newBadges[i];
        return (
          b.annotation.id === n.annotation.id &&
          b.openCommentCount === n.openCommentCount &&
          b.allResolved === n.allResolved &&
          Math.abs(b.rect.top - n.rect.top) < 1 &&
          Math.abs(b.rect.left - n.rect.left) < 1 &&
          Math.abs(b.rect.right - n.rect.right) < 1 &&
          Math.abs(b.rect.bottom - n.rect.bottom) < 1
        );
      });
      return unchanged ? prev : newBadges;
    });
  }, [allAnnotations, registeredMarkerIds, showMarkers, currentRoute, allComments, commentsConfig]);

  // Update positions on mount, scroll, resize, and when dependencies change
  useEffect(() => {
    if (!showMarkers) return;
    updateBadges();

    window.addEventListener("scroll", updateBadges, true);
    window.addEventListener("resize", updateBadges);

    // Debounce MutationObserver to avoid infinite loops:
    // setBadges re-renders → DOM changes → observer fires → setBadges again
    let rafId = 0;
    const debouncedUpdate = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(updateBadges);
    };
    const observer = new MutationObserver(debouncedUpdate);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      window.removeEventListener("scroll", updateBadges, true);
      window.removeEventListener("resize", updateBadges);
      cancelAnimationFrame(rafId);
      observer.disconnect();
    };
  }, [showMarkers, updateBadges]);

  // Show hover highlight on hovered element
  useEffect(() => {
    if (!showMarkers || !hoveredAnnotationId) return;

    const badge = badges.find((b) => b.annotation.id === hoveredAnnotationId);
    if (!badge) return;

    const el = findElementByAnnotationId(badge.annotation.elementId || badge.annotation.id);
    if (!el) return;

    const cleanup = showHoverHighlight(el, settings.zIndex);
    return () => cleanup();
  }, [hoveredAnnotationId, badges, showMarkers, settings.zIndex]);

  if (!showMarkers || badges.length === 0) return null;

  const elements: React.ReactElement[] = [];

  for (const badge of badges) {
    const { annotation } = badge;
    const isActive = activeAnnotationId === annotation.id;
    const isHovered = hoveredAnnotationId === annotation.id;
    const annotationType = annotation.type ?? "documentation";
    const typeColor = TYPE_COLORS[annotationType];
    const TypeIcon = TYPE_ICONS[annotationType];

    // Annotation type badge (top-right of element)
    elements.push(
      React.createElement(
        "button",
        {
          key: `auto-${annotation.id}`,
          onClick: (e: React.MouseEvent) => {
            e.stopPropagation();
            setActiveAnnotationId(isActive ? null : annotation.id);
            if (!isActive) setPanelOpen(true);
          },
          onMouseEnter: () => setHoveredAnnotationId(annotation.id),
          onMouseLeave: () => setHoveredAnnotationId(null),
          "aria-label": `Annotation: ${annotation.title}`,
          style: {
            position: "fixed",
            top: badge.rect.top - 8,
            left: badge.rect.right - 8,
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
            boxShadow: isActive
              ? `0 0 0 4px ${typeColor.text}22, 0 1px 3px rgba(0,0,0,0.15)`
              : "0 1px 3px rgba(0,0,0,0.15)",
            transform: isHovered ? "scale(1.1)" : "scale(1)",
            transition: "transform 0.15s ease, box-shadow 0.15s ease",
            padding: 0,
          } as React.CSSProperties,
        },
        React.createElement(TypeIcon, { size: 12, color: typeColor.text })
      )
    );

    // Feedback comment badge (offset to the right of the annotation badge)
    if (badge.hasComments) {
      elements.push(
        React.createElement(
          "div",
          {
            key: `auto-fb-${annotation.id}`,
            "aria-label": `${badge.openCommentCount} open comments`,
            style: {
              position: "fixed",
              top: badge.rect.top - 8,
              left: badge.rect.right - 8 + 22,
              zIndex: settings.zIndex + 19,
              width: 24,
              height: 24,
              borderRadius: "50%",
              background: badge.allResolved ? "#F2F4F7" : "#EFF8FF",
              color: badge.allResolved ? "#98A2B3" : "#175CD3",
              border: `1.5px solid ${badge.allResolved ? "#D0D5DD" : "#B2DDFF"}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
              pointerEvents: "none",
              padding: 0,
            } as React.CSSProperties,
          },
          badge.openCommentCount > 0
            ? React.createElement(
                "span",
                { style: { fontSize: 10, fontWeight: 700, lineHeight: 1 } },
                badge.openCommentCount
              )
            : React.createElement(MessageSquareTextIcon, {
                size: 12,
                color: badge.allResolved ? "#98A2B3" : "#175CD3",
              })
        )
      );
    }
  }

  // Popover for active auto-discovered annotation
  if (activeBadge && activeAnnotation) {
    const annotationType = activeAnnotation.type ?? "documentation";
    const popoverTypeColor = TYPE_COLORS[annotationType];
    const PopoverTypeIcon = TYPE_ICONS[annotationType];

    elements.push(
      React.createElement(
        "div",
        {
          key: `auto-popover-${activeAnnotation.id}`,
          style: {
            ...getFixedPopoverStyle(activeBadge.rect, 300, 460),
            minWidth: 300,
            maxWidth: 380,
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
        React.createElement(
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
                  color: popoverTypeColor.text,
                  background: popoverTypeColor.bg,
                  border: `1px solid ${popoverTypeColor.border}`,
                  borderRadius: 4,
                  padding: "2px 6px",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                } as React.CSSProperties,
              },
              React.createElement(PopoverTypeIcon, { size: 10, color: popoverTypeColor.text }),
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
            activeAnnotation.title
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
            activeAnnotation.body
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
            `${activeAnnotation.author} · ${activeAnnotation.date}`
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
    );
  }

  return React.createElement(React.Fragment, null, ...elements);
}

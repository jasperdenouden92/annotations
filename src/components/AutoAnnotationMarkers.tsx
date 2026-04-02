import React, { useState, useEffect, useCallback } from "react";
import { useAnnotationsSafe } from "../context/useAnnotationsSafe";
import { findElementByAnnotationId } from "../utils/find-element";
import { showHoverHighlight, removeHoverHighlight } from "../utils/find-element";
import { MessageSquareTextIcon } from "../icons";
import { TYPE_COLORS, TYPE_ICONS } from "../constants";
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

    setBadges(newBadges);
  }, [allAnnotations, registeredMarkerIds, showMarkers, currentRoute, allComments, commentsConfig]);

  // Update positions on mount, scroll, resize, and when dependencies change
  useEffect(() => {
    if (!showMarkers) return;
    updateBadges();

    window.addEventListener("scroll", updateBadges, true);
    window.addEventListener("resize", updateBadges);

    // Also observe DOM mutations so we catch dynamically rendered elements
    const observer = new MutationObserver(updateBadges);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      window.removeEventListener("scroll", updateBadges, true);
      window.removeEventListener("resize", updateBadges);
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

  return React.createElement(React.Fragment, null, ...elements);
}

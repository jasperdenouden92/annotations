import React, { useState, useEffect, useCallback } from "react";
import { useAnnotationsSafe } from "../context/useAnnotationsSafe";
import { findElementByAnnotationId } from "../utils/find-element";
import { MessageSquareTextIcon } from "../icons";
import type { Comment } from "../types";

interface FeedbackBadgeInfo {
  annotationId: string;
  rect: DOMRect;
  openCount: number;
  totalCount: number;
  allResolved: boolean;
}

/**
 * Renders floating feedback badges on DOM elements that have comments
 * but are NOT wrapped in an AnnotationMarker component.
 * AnnotationMarker already renders its own feedback badges.
 */
export function FeedbackMarkers() {
  const {
    annotationMode,
    inspectorActive,
    allComments,
    commentsConfig,
    settings,
    setActiveAnnotationId,
    activeAnnotationId,
    setPanelOpen,
    currentRoute,
    registeredMarkerIds,
  } = useAnnotationsSafe();

  const [badges, setBadges] = useState<FeedbackBadgeInfo[]>([]);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const showMarkers = mounted && (annotationMode || inspectorActive);

  const updateBadges = useCallback(() => {
    if (!commentsConfig || !showMarkers) {
      setBadges([]);
      return;
    }

    // Group comments by annotationId, excluding those handled by AnnotationMarker
    // and filtering to current page only
    const grouped = new Map<string, Comment[]>();
    for (const c of allComments) {
      if (!c.annotationId || registeredMarkerIds.has(c.annotationId)) continue;
      if (!c.pagina || c.pagina !== currentRoute) continue;
      const list = grouped.get(c.annotationId) || [];
      list.push(c);
      grouped.set(c.annotationId, list);
    }

    const newBadges: FeedbackBadgeInfo[] = [];
    for (const [annotationId, comments] of grouped) {
      const el = findElementByAnnotationId(annotationId);
      if (!el) continue;

      const rect = el.getBoundingClientRect();
      const openCount = comments.filter((c) => c.status !== "Opgelost").length;
      newBadges.push({
        annotationId,
        rect,
        openCount,
        totalCount: comments.length,
        allResolved: openCount === 0,
      });
    }

    setBadges(newBadges);
  }, [allComments, registeredMarkerIds, commentsConfig, showMarkers, currentRoute]);

  // Update positions on mount, scroll, resize, and when comments change
  useEffect(() => {
    if (!showMarkers) return;
    updateBadges();

    window.addEventListener("scroll", updateBadges, true);
    window.addEventListener("resize", updateBadges);
    return () => {
      window.removeEventListener("scroll", updateBadges, true);
      window.removeEventListener("resize", updateBadges);
    };
  }, [showMarkers, updateBadges]);

  if (!showMarkers || badges.length === 0) return null;

  return React.createElement(
    React.Fragment,
    null,
    ...badges.map((badge) => {
      const isActive = activeAnnotationId === badge.annotationId;

      return React.createElement(
        "button",
        {
          key: badge.annotationId,
          onClick: (e: React.MouseEvent) => {
            e.stopPropagation();
            setActiveAnnotationId(isActive ? null : badge.annotationId);
            if (!isActive) setPanelOpen(true);
          },
          "aria-label": `${badge.openCount} open feedback`,
          style: {
            position: "fixed",
            top: badge.rect.top - 8,
            left: badge.rect.right - 8,
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
            boxShadow: isActive
              ? "0 0 0 4px rgba(23, 92, 211, 0.13), 0 1px 3px rgba(0,0,0,0.15)"
              : "0 1px 3px rgba(0,0,0,0.15)",
            cursor: "pointer",
            padding: 0,
            transition: "transform 0.15s ease, box-shadow 0.15s ease",
          } as React.CSSProperties,
        },
        badge.openCount > 0
          ? React.createElement(
              "span",
              { style: { fontSize: 10, fontWeight: 700, lineHeight: 1 } },
              badge.openCount
            )
          : React.createElement(MessageSquareTextIcon, {
              size: 12,
              color: badge.allResolved ? "#98A2B3" : "#175CD3",
            })
      );
    })
  );
}

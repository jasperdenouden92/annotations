import React, { useState, useEffect, useRef, useCallback } from "react";
import { useAnnotations } from "../context/useAnnotations";
import { useAllComments } from "../hooks/useAllComments";
import { getButtonPosition, snapToCorner } from "../utils/drag";
import { MessageSquareTextIcon } from "../icons";

const DRAG_THRESHOLD = 5; // px before a mousedown becomes a drag

export function AnnotationButton() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const {
    annotationMode,
    setAnnotationMode,
    panelOpen,
    setPanelOpen,
    panelCorner,
    setPanelCorner,
    currentAnnotations,
    currentRoute,
    labels,
    settings,
    commentsConfig,
  } = useAnnotations();

  const { comments: allFeedback } = useAllComments({
    apiBase: commentsConfig?.apiBase ?? "",
    project: commentsConfig?.project ?? "",
    enabled: !!commentsConfig,
  });

  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef({ startX: 0, startY: 0, didDrag: false });

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    dragRef.current = { startX: e.clientX, startY: e.clientY, didDrag: false };

    const handleMouseMove = (ev: MouseEvent) => {
      const dx = ev.clientX - dragRef.current.startX;
      const dy = ev.clientY - dragRef.current.startY;
      if (!dragRef.current.didDrag && Math.hypot(dx, dy) > DRAG_THRESHOLD) {
        dragRef.current.didDrag = true;
        setIsDragging(true);
      }
      if (dragRef.current.didDrag) {
        const corner = snapToCorner(ev.clientX, ev.clientY, window.innerWidth, window.innerHeight);
        setPanelCorner(corner);
      }
    };

    const handleMouseUp = () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      // Small delay so the click handler can check didDrag
      requestAnimationFrame(() => setIsDragging(false));
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  }, [setPanelCorner]);

  if (!mounted) return null;

  const openFeedbackCount = allFeedback.filter(
    (c) => c.status !== "Opgelost" && c.pagina === currentRoute
  ).length;
  const totalCount = currentAnnotations.length + openFeedbackCount;

  const handleClick = () => {
    if (dragRef.current.didDrag) return; // was a drag, not a click
    if (!annotationMode) {
      setAnnotationMode(true);
      setPanelOpen(true);
    } else {
      setPanelOpen(!panelOpen);
    }
  };

  return React.createElement(
    "button",
    {
      "data-annotation-button": "",
      onClick: handleClick,
      onMouseDown: handleMouseDown,
      title: annotationMode ? labels.toggleHide : labels.toggleShow,
      "aria-label": annotationMode ? labels.toggleHide : labels.toggleShow,
      style: {
        ...getButtonPosition(panelCorner),
        zIndex: settings.zIndex + 999,
        width: 40,
        height: 40,
        borderRadius: 10,
        background: "#FFFFFF",
        color: "#344054",
        border: "1px solid #D0D5DD",
        cursor: isDragging ? "grabbing" : "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 1px 2px rgba(16,24,40,0.05), 0 1px 3px rgba(16,24,40,0.1)",
        transition: isDragging ? "none" : "all 0.15s ease",
      } as React.CSSProperties,
    },
    React.createElement(MessageSquareTextIcon, {
      size: 20,
      color: "#667085",
    }),
    totalCount > 0 &&
      React.createElement(
        "span",
        {
          style: {
            position: "absolute",
            top: -6,
            right: -6,
            minWidth: 18,
            height: 18,
            borderRadius: 9,
            background: "#B42318",
            border: "2px solid #FFFFFF",
            color: "#FFFFFF",
            fontSize: 10,
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "0 4px",
          } as React.CSSProperties,
        },
        totalCount
      )
  );
}

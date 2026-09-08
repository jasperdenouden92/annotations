import React, { useState, useEffect, useRef, useCallback } from "react";
import { useAnnotations } from "../context/use-annotations";
import { useAllComments } from "../hooks/use-all-comments";
import { useAnnotationStyles } from "../styles/inject";
import { cx } from "../utils/cx";
import { getButtonPosition, snapToCorner } from "../utils/drag";
import { matchRoute } from "../utils/route-matching";
import { MessageSquareTextIcon } from "../icons";

const DRAG_THRESHOLD = 5; // px before a mousedown becomes a drag

export function AnnotationButton() {
  useAnnotationStyles();

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
    (c) => c.status !== "Opgelost" && matchRoute(currentRoute, c.pagina ?? "")
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

  const toggleLabel = annotationMode ? labels.toggleHide : labels.toggleShow;
  // aria-label wins over anything inside the button, so the counter has to be part
  // of the label itself rather than a visually hidden span.
  const label =
    totalCount > 0
      ? `${toggleLabel} — ${totalCount} op deze pagina`
      : toggleLabel;

  return React.createElement(
    "button",
    {
      type: "button",
      "data-annotation-button": "",
      className: cx("orbit-root", "orbit-fab", isDragging && "orbit-fab--dragging"),
      style: getButtonPosition(panelCorner),
      onClick: handleClick,
      onMouseDown: handleMouseDown,
      title: toggleLabel,
      "aria-label": label,
      "aria-expanded": annotationMode && panelOpen,
    },
    React.createElement(MessageSquareTextIcon, { size: 20 }),
    totalCount > 0 &&
      React.createElement(
        "span",
        { className: "orbit-fab__count", "aria-hidden": true },
        totalCount
      )
  );
}

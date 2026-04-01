import React, { useState, useEffect, useCallback, useRef } from "react";
import { useAnnotationsSafe } from "../context/useAnnotationsSafe";
import { useComments } from "../hooks/useComments";
import { CommentThread } from "./CommentThread";
import { CommentForm } from "./CommentForm";
import { getElementLabel } from "../utils/element-id";
import { getInspectorButtonPosition, snapToCorner } from "../utils/drag";
import { PANEL_COLORS } from "../constants";
import { XIcon } from "../icons";

const DRAG_THRESHOLD = 5;

const DATA_INSPECTOR = "data-annotation-inspector";

interface SelectedElement {
  el: HTMLElement;
  rect: DOMRect;
  path: string;
  label: string;
}

function isInspectorUI(el: HTMLElement): boolean {
  let current: HTMLElement | null = el;
  while (current) {
    if (current.hasAttribute(DATA_INSPECTOR)) return true;
    current = current.parentElement;
  }
  return false;
}

function isAnnotationButton(el: HTMLElement): boolean {
  let current: HTMLElement | null = el;
  while (current) {
    if (current.hasAttribute("data-annotation-button")) return true;
    current = current.parentElement;
  }
  return false;
}

function InspectorPopover({
  selected,
  onClose,
}: {
  selected: SelectedElement;
  onClose: () => void;
}) {
  const { commentsConfig, settings } = useAnnotationsSafe();
  const { comments, isLoading, error, submitComment } = useComments({
    apiBase: commentsConfig?.apiBase ?? "",
    project: commentsConfig?.project ?? "",
    annotationId: selected.path,
    label: selected.label,
    enabled: !!commentsConfig,
  });

  // Position: prefer below the element, but flip up if not enough space
  const viewportH = window.innerHeight;
  const spaceBelow = viewportH - selected.rect.bottom;
  const placeBelow = spaceBelow > 240;

  const style: React.CSSProperties = {
    position: "fixed",
    left: Math.min(selected.rect.left, window.innerWidth - 340),
    top: placeBelow ? selected.rect.bottom + 8 : undefined,
    bottom: placeBelow ? undefined : viewportH - selected.rect.top + 8,
    width: 320,
    maxHeight: 420,
    overflowY: "auto",
    zIndex: settings.zIndex + 50,
    background: PANEL_COLORS.bg,
    border: `1px solid ${PANEL_COLORS.border}`,
    borderRadius: 8,
    boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
    padding: 12,
    fontFamily:
      'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  };

  return React.createElement(
    "div",
    {
      [DATA_INSPECTOR]: "",
      style,
      onClick: (e: React.MouseEvent) => e.stopPropagation(),
    },
    // Header
    React.createElement(
      "div",
      {
        style: {
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 8,
        } as React.CSSProperties,
      },
      React.createElement(
        "div",
        {
          style: {
            fontSize: 12,
            color: PANEL_COLORS.textMuted,
            fontFamily: "monospace",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            flex: 1,
            marginRight: 8,
          } as React.CSSProperties,
        },
        selected.label
      ),
      React.createElement(
        "button",
        {
          onClick: onClose,
          style: {
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 2,
            display: "flex",
            flexShrink: 0,
          } as React.CSSProperties,
        },
        React.createElement(XIcon, { size: 14, color: PANEL_COLORS.textMuted })
      )
    ),
    // Thread + form
    React.createElement(CommentThread, { comments, isLoading, error }),
    React.createElement(CommentForm, { onSubmit: submitComment })
  );
}

export function Inspector() {
  const { commentsConfig, settings, panelCorner, setPanelCorner, inspectorActive: active, setInspectorActive: setActive } = useAnnotationsSafe();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const [hoverRect, setHoverRect] = useState<DOMRect | null>(null);
  const [selected, setSelected] = useState<SelectedElement | null>(null);
  const hoveredRef = useRef<HTMLElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef({ startX: 0, startY: 0, didDrag: false });

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!active || selected) return;
      const el = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null;
      if (!el || isInspectorUI(el)) {
        setHoverRect(null);
        hoveredRef.current = null;
        return;
      }
      if (el !== hoveredRef.current) {
        hoveredRef.current = el;
        setHoverRect(el.getBoundingClientRect());
      }
    },
    [active, selected]
  );

  const handleClick = useCallback(
    (e: MouseEvent) => {
      if (!active) return;
      const el = e.target as HTMLElement;
      if (isInspectorUI(el)) return;

      // Let annotation button clicks through — deactivate inspector
      if (isAnnotationButton(el)) {
        setActive(false);
        setSelected(null);
        setHoverRect(null);
        return;
      }

      e.preventDefault();
      e.stopPropagation();

      if (!el.id) {
        console.warn(
          "[@jasperdenouden92/annotations] Annotatable component mist een id prop"
        );
      }

      const rect = el.getBoundingClientRect();
      setSelected({
        el,
        rect,
        path: el.id || getElementLabel(el),
        label: getElementLabel(el),
      });
      setHoverRect(null);
    },
    [active]
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (selected) {
          setSelected(null);
        } else if (active) {
          setActive(false);
          setHoverRect(null);
        }
      }
    },
    [active, selected]
  );

  useEffect(() => {
    if (!active) return;
    document.addEventListener("mousemove", handleMouseMove, true);
    document.addEventListener("click", handleClick, true);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove, true);
      document.removeEventListener("click", handleClick, true);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [active, handleMouseMove, handleClick, handleKeyDown]);

  // Update selected rect on scroll/resize
  useEffect(() => {
    if (!selected) return;
    const update = () => {
      setSelected((prev) =>
        prev ? { ...prev, rect: prev.el.getBoundingClientRect() } : null
      );
    };
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [selected]);

  if (!mounted || !commentsConfig) return null;

  const handleButtonMouseDown = (e: React.MouseEvent) => {
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
      requestAnimationFrame(() => setIsDragging(false));
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  // Toggle button — positioned above the AnnotationButton
  const toggleButton = React.createElement(
    "button",
    {
      [DATA_INSPECTOR]: "",
      onClick: () => {
        if (dragRef.current.didDrag) return;
        setActive(!active);
        setSelected(null);
        setHoverRect(null);
      },
      onMouseDown: handleButtonMouseDown,
      title: active ? "Inspector sluiten" : "Comment plaatsen",
      "aria-label": active ? "Inspector sluiten" : "Comment plaatsen",
      style: {
        ...getInspectorButtonPosition(panelCorner),
        zIndex: settings.zIndex + 10,
        width: 40,
        height: 40,
        borderRadius: 10,
        background: active ? "#175CD3" : "#FFFFFF",
        color: active ? "#FFFFFF" : "#344054",
        border: `1px solid ${active ? "#175CD3" : "#D0D5DD"}`,
        cursor: isDragging ? "grabbing" : "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow:
          "0 1px 2px rgba(16,24,40,0.05), 0 1px 3px rgba(16,24,40,0.1)",
        transition: isDragging ? "none" : "all 0.15s ease",
        fontSize: 18,
      } as React.CSSProperties,
    },
    // Crosshair / target icon inline
    React.createElement(
      "svg",
      {
        width: 20,
        height: 20,
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: active ? "#FFFFFF" : "#667085",
        strokeWidth: 2,
        strokeLinecap: "round",
        strokeLinejoin: "round",
      },
      React.createElement("circle", { cx: 12, cy: 12, r: 10 }),
      React.createElement("line", { x1: 22, y1: 12, x2: 18, y2: 12 }),
      React.createElement("line", { x1: 6, y1: 12, x2: 2, y2: 12 }),
      React.createElement("line", { x1: 12, y1: 6, x2: 12, y2: 2 }),
      React.createElement("line", { x1: 12, y1: 22, x2: 12, y2: 18 })
    )
  );

  // Highlight overlay
  const highlight =
    active && hoverRect && !selected
      ? React.createElement("div", {
          [DATA_INSPECTOR]: "",
          style: {
            position: "fixed",
            left: hoverRect.left,
            top: hoverRect.top,
            width: hoverRect.width,
            height: hoverRect.height,
            border: "2px solid #175CD3",
            borderRadius: 4,
            background: "rgba(23, 92, 211, 0.06)",
            pointerEvents: "none",
            zIndex: settings.zIndex + 40,
            transition: "all 0.08s ease",
          } as React.CSSProperties,
        })
      : null;

  // Selected element outline
  const selectedOutline = selected
    ? React.createElement("div", {
        [DATA_INSPECTOR]: "",
        style: {
          position: "fixed",
          left: selected.rect.left,
          top: selected.rect.top,
          width: selected.rect.width,
          height: selected.rect.height,
          border: "2px solid #175CD3",
          borderRadius: 4,
          background: "rgba(23, 92, 211, 0.08)",
          pointerEvents: "none",
          zIndex: settings.zIndex + 40,
        } as React.CSSProperties,
      })
    : null;

  // Cursor override when active
  const cursorOverride =
    active && !selected
      ? React.createElement("style", {
          [DATA_INSPECTOR]: "",
          dangerouslySetInnerHTML: {
            __html: `* { cursor: crosshair !important; }`,
          },
        })
      : null;

  // Popover
  const popover = selected
    ? React.createElement(InspectorPopover, {
        selected,
        onClose: () => setSelected(null),
      })
    : null;

  return React.createElement(
    React.Fragment,
    null,
    toggleButton,
    cursorOverride,
    highlight,
    selectedOutline,
    popover
  );
}

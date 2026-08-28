import React, { useState, useEffect, useCallback, useRef } from "react";
import { useAnnotationsSafe } from "../context/use-annotations-safe";
import { useComments } from "../hooks/use-comments";
import { useAnnotationStyles, useInspectorCursor } from "../styles/inject";
import { cx } from "../utils/cx";
import { useStableId } from "../utils/use-stable-id";
import { getElementLabel, getElementPath } from "../utils/element-id";
import { getInspectorButtonPosition, snapToCorner } from "../utils/drag";
import { getFixedPopoverStyle } from "../utils/popover-position";
import { AnnotationPopover } from "./annotation-popover";
import { CrosshairIcon, XIcon } from "../icons";

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
  const { commentsConfig } = useAnnotationsSafe();
  const popoverId = useStableId("szan-inspector-popover");

  const { comments, isLoading, error, submitComment } = useComments({
    apiBase: commentsConfig?.apiBase ?? "",
    project: commentsConfig?.project ?? "",
    annotationId: selected.path,
    label: selected.label,
    enabled: !!commentsConfig,
  });

  const header = React.createElement(
    "div",
    { className: "szan-popover__section" },
    React.createElement(
      "div",
      { className: "szan-popover__header" },
      React.createElement("div", { className: "szan-mono" }, selected.label),
      React.createElement(
        "button",
        {
          type: "button",
          className: "szan-icon-button",
          onClick: onClose,
          "aria-label": "Sluit feedbackvenster",
        },
        React.createElement(XIcon, { size: 16 })
      )
    )
  );

  return React.createElement(AnnotationPopover, {
    id: popoverId,
    header,
    showComments: true,
    comments,
    isLoading,
    error,
    onSubmit: submitComment,
    onClose,
    variant: "inspector",
    style: getFixedPopoverStyle(selected.rect, 320, 420),
    extraProps: { [DATA_INSPECTOR]: "" },
  });
}

export function Inspector() {
  useAnnotationStyles();

  const {
    commentsConfig,
    panelCorner,
    setPanelCorner,
    inspectorActive: active,
    setInspectorActive: setActive,
  } = useAnnotationsSafe();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const [hoverRect, setHoverRect] = useState<DOMRect | null>(null);
  const [selected, setSelected] = useState<SelectedElement | null>(null);
  const hoveredRef = useRef<HTMLElement | null>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef({ startX: 0, startY: 0, didDrag: false });

  useInspectorCursor(active && !selected);

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

      // Walk up from clicked element to find nearest ancestor with a stable identifier.
      // Priority: data-annotation-id > id attribute > CSS selector path.
      // Skip elements that cover most of the viewport (e.g. <div id="root">).
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      let target: HTMLElement | null = el;
      let stableId: string | null = null;

      // Pass 1: prefer data-annotation-id (predefined annotation markers)
      let walk: HTMLElement | null = el;
      while (walk && walk !== document.body) {
        const annotationId = walk.getAttribute("data-annotation-id");
        if (annotationId) {
          const r = walk.getBoundingClientRect();
          if (!(r.width > vw * 0.9 && r.height > vh * 0.9)) {
            stableId = annotationId;
            target = walk;
            break;
          }
        }
        walk = walk.parentElement;
      }

      // Pass 2: fall back to element id attribute
      if (!stableId) {
        walk = el;
        while (walk && walk !== document.body) {
          if (walk.id) {
            const r = walk.getBoundingClientRect();
            if (!(r.width > vw * 0.9 && r.height > vh * 0.9)) {
              stableId = walk.id;
              target = walk;
              break;
            }
          }
          walk = walk.parentElement;
        }
      }

      // Pass 3: fall back to CSS selector path
      if (!stableId || !target) {
        target = el;
        stableId = getElementPath(el);
      }

      const rect = target.getBoundingClientRect();
      setSelected({
        el: target,
        rect,
        path: stableId,
        label: getElementLabel(target),
      });
      setHoverRect(null);
    },
    [active, setActive]
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (selected) {
        setSelected(null);
      } else if (active) {
        setActive(false);
        setHoverRect(null);
        toggleRef.current?.focus();
      }
    },
    [active, selected, setActive]
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

  const toggleLabel = active ? "Inspector sluiten" : "Comment plaatsen";

  const toggleButton = React.createElement(
    "button",
    {
      key: "toggle",
      type: "button",
      ref: toggleRef,
      [DATA_INSPECTOR]: "",
      className: cx(
        "szan-root",
        "szan-fab",
        "szan-fab--inspector",
        active && "szan-fab--active",
        isDragging && "szan-fab--dragging"
      ),
      style: getInspectorButtonPosition(panelCorner),
      onClick: () => {
        if (dragRef.current.didDrag) return;
        setActive(!active);
        setSelected(null);
        setHoverRect(null);
      },
      onMouseDown: handleButtonMouseDown,
      title: toggleLabel,
      "aria-label": toggleLabel,
      "aria-pressed": active,
    },
    React.createElement(CrosshairIcon, { size: 20 })
  );

  // Picking mode changes how the whole page behaves, so it is announced rather
  // than left to the button's colour.
  const announcement = React.createElement(
    "div",
    { key: "status", className: "szan-root szan-sr-only", role: "status" },
    active && !selected ? "Inspectormodus actief. Klik een element aan om feedback te plaatsen, Escape om te stoppen." : ""
  );

  const highlight =
    active && hoverRect && !selected
      ? React.createElement("div", {
          key: "hover",
          [DATA_INSPECTOR]: "",
          className: "szan-root szan-overlay",
          style: {
            left: hoverRect.left,
            top: hoverRect.top,
            width: hoverRect.width,
            height: hoverRect.height,
          },
        })
      : null;

  const selectedOutline = selected
    ? React.createElement("div", {
        key: "selected",
        [DATA_INSPECTOR]: "",
        className: "szan-root szan-overlay szan-overlay--selected",
        style: {
          left: selected.rect.left,
          top: selected.rect.top,
          width: selected.rect.width,
          height: selected.rect.height,
        },
      })
    : null;

  const popover = selected
    ? React.createElement(InspectorPopover, {
        key: "popover",
        selected,
        onClose: () => {
          setSelected(null);
          toggleRef.current?.focus();
        },
      })
    : null;

  return React.createElement(
    React.Fragment,
    null,
    toggleButton,
    announcement,
    highlight,
    selectedOutline,
    popover
  );
}

import React, { useState, useRef, useCallback, useEffect } from "react";
import { useAnnotations } from "../context/useAnnotations";
import { getCornerPosition, snapToCorner } from "../utils/drag";
import { XIcon, SearchIcon, GripVerticalIcon } from "../icons";
import { PANEL_COLORS } from "../constants";
import { AnnotationCard } from "./AnnotationCard";

export function AnnotationPanel() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const {
    annotationMode,
    panelOpen,
    setPanelOpen,
    panelCorner,
    setPanelCorner,
    activeAnnotationId,
    setActiveAnnotationId,
    hoveredAnnotationId,
    setHoveredAnnotationId,
    currentAnnotations,
    allAnnotations,
    labels,
    settings,
  } = useAnnotations();

  const [tab, setTab] = useState<"page" | "all">("page");
  const [searchQuery, setSearchQuery] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const activeCardRef = useRef<HTMLDivElement>(null);

  const { panelWidth, panelHeight, zIndex, accentColor } = settings;

  // Auto-scroll to active annotation card
  useEffect(() => {
    if (activeAnnotationId && activeCardRef.current) {
      activeCardRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [activeAnnotationId]);

  // Drag handling
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!panelRef.current) return;
      const rect = panelRef.current.getBoundingClientRect();
      dragOffsetRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
      setIsDragging(true);
    },
    []
  );

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!panelRef.current) return;
      const x = e.clientX - dragOffsetRef.current.x + panelWidth / 2;
      const y = e.clientY - dragOffsetRef.current.y + panelHeight / 2;
      const corner = snapToCorner(x, y, window.innerWidth, window.innerHeight);
      setPanelCorner(corner);
    };

    const handleMouseUp = () => setIsDragging(false);

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, setPanelCorner, panelWidth, panelHeight]);

  if (!mounted || !annotationMode || !panelOpen) return null;

  const sourceAnnotations = tab === "page" ? currentAnnotations : allAnnotations;
  const filtered = searchQuery
    ? sourceAnnotations.filter(
        (a) =>
          a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          a.body.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : sourceAnnotations;

  const positionStyles = getCornerPosition(panelCorner, panelWidth, panelHeight);

  return React.createElement(
    "div",
    {
      ref: panelRef,
      style: {
        ...positionStyles,
        width: panelWidth,
        height: panelHeight,
        zIndex: zIndex + 999,
        background: PANEL_COLORS.bg,
        borderRadius: 12,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        border: `1px solid ${PANEL_COLORS.border}`,
        boxShadow: "0 8px 24px rgba(16,24,40,0.08), 0 20px 48px rgba(16,24,40,0.12)",
        transition: isDragging ? "none" : "all 0.2s ease-out",
        cursor: isDragging ? "grabbing" : "default",
        fontFamily:
          'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      } as React.CSSProperties,
    },

    // ── Header ──
    React.createElement(
      "div",
      {
        style: {
          display: "flex",
          alignItems: "center",
          padding: "12px 14px",
          borderBottom: `1px solid ${PANEL_COLORS.border}`,
          gap: 8,
        } as React.CSSProperties,
      },
      // Drag handle
      React.createElement(
        "div",
        {
          onMouseDown: handleMouseDown,
          style: {
            cursor: "grab",
            display: "flex",
            alignItems: "center",
            color: PANEL_COLORS.textMuted,
          } as React.CSSProperties,
        },
        React.createElement(GripVerticalIcon, { size: 16, color: PANEL_COLORS.textMuted })
      ),
      // Title
      React.createElement(
        "span",
        {
          style: {
            flex: 1,
            fontSize: 14,
            fontWeight: 600,
            color: PANEL_COLORS.textPrimary,
          } as React.CSSProperties,
        },
        labels.panelTitle
      ),
      // Close
      React.createElement(
        "button",
        {
          onClick: () => setPanelOpen(false),
          "aria-label": "Sluit panel",
          style: {
            background: "none",
            border: "none",
            cursor: "pointer",
            color: PANEL_COLORS.textMuted,
            display: "flex",
            alignItems: "center",
            padding: 4,
            borderRadius: 4,
          } as React.CSSProperties,
        },
        React.createElement(XIcon, { size: 16, color: PANEL_COLORS.textMuted })
      )
    ),

    // ── Tabs ──
    React.createElement(
      "div",
      {
        style: {
          display: "flex",
          padding: "8px 14px 0",
          gap: 4,
        } as React.CSSProperties,
      },
      ...[
        { key: "page" as const, label: labels.tabCurrentPage, count: currentAnnotations.length },
        { key: "all" as const, label: labels.tabAll, count: allAnnotations.length },
      ].map((t) =>
        React.createElement(
          "button",
          {
            key: t.key,
            onClick: () => setTab(t.key),
            style: {
              background: tab === t.key ? PANEL_COLORS.bgHover : "transparent",
              border: "none",
              borderRadius: 6,
              padding: "6px 12px",
              cursor: "pointer",
              fontSize: 12,
              fontFamily: "inherit",
              fontWeight: 500,
              color:
                tab === t.key ? PANEL_COLORS.textPrimary : PANEL_COLORS.textSecondary,
              display: "flex",
              alignItems: "center",
              gap: 6,
              transition: "background 0.1s ease",
            } as React.CSSProperties,
          },
          t.label,
          React.createElement(
            "span",
            {
              style: {
                background: tab === t.key ? "#F2F4F7" : "transparent",
                color: tab === t.key ? "#344054" : "#98A2B3",
                border: `1px solid ${tab === t.key ? "#EAECF0" : "transparent"}`,
                fontSize: 10,
                fontWeight: 600,
                borderRadius: 8,
                padding: "1px 6px",
                minWidth: 18,
                textAlign: "center",
              } as React.CSSProperties,
            },
            t.count
          )
        )
      )
    ),

    // ── Search ──
    React.createElement(
      "div",
      {
        style: {
          padding: "8px 14px",
          position: "relative",
        } as React.CSSProperties,
      },
      React.createElement(
        "div",
        {
          style: {
            position: "absolute",
            left: 24,
            top: "50%",
            transform: "translateY(-50%)",
            display: "flex",
            pointerEvents: "none",
          } as React.CSSProperties,
        },
        React.createElement(SearchIcon, { size: 14, color: PANEL_COLORS.textMuted })
      ),
      React.createElement("input", {
        type: "text",
        placeholder: labels.searchPlaceholder,
        value: searchQuery,
        onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
          setSearchQuery(e.target.value),
        style: {
          width: "100%",
          background: PANEL_COLORS.bgHover,
          border: `1px solid ${PANEL_COLORS.border}`,
          borderRadius: 6,
          padding: "7px 10px 7px 32px",
          fontSize: 12,
          fontFamily: "inherit",
          color: PANEL_COLORS.textPrimary,
          outline: "none",
          boxSizing: "border-box",
        } as React.CSSProperties,
      })
    ),

    // ── Annotation list ──
    React.createElement(
      "div",
      {
        style: {
          flex: 1,
          overflowY: "auto",
          padding: "4px 8px 8px",
          display: "flex",
          flexDirection: "column",
          gap: 2,
        } as React.CSSProperties,
      },
      filtered.length === 0
        ? React.createElement(
            "p",
            {
              style: {
                textAlign: "center",
                color: PANEL_COLORS.textMuted,
                fontSize: 12,
                padding: "24px 0",
              } as React.CSSProperties,
            },
            labels.noResults
          )
        : filtered.map((annotation) =>
            React.createElement(
              "div",
              {
                key: annotation.id,
                ref:
                  annotation.id === activeAnnotationId
                    ? activeCardRef
                    : undefined,
              },
              React.createElement(AnnotationCard, {
                annotation,
                isActive: annotation.id === activeAnnotationId,
                isHovered: annotation.id === hoveredAnnotationId,
                accentColor,
                onSelect: (id: string) => setActiveAnnotationId(id),
                onHoverStart: (id: string) => setHoveredAnnotationId(id),
                onHoverEnd: () => setHoveredAnnotationId(null),
              })
            )
          )
    )
  );
}

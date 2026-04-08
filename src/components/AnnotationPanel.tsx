import React, { useState, useRef, useCallback, useEffect } from "react";
import { useAnnotations } from "../context/useAnnotations";
import { useAllComments } from "../hooks/useAllComments";
import { getCornerPosition, snapToCorner } from "../utils/drag";
import { findElementByAnnotationId, scrollToAndHighlight, showHoverHighlight, removeHoverHighlight } from "../utils/find-element";
import { XIcon, SearchIcon, GripVerticalIcon } from "../icons";
import { PANEL_COLORS, TYPE_COLORS, TYPE_ICONS } from "../constants";
import { AnnotationCard } from "./AnnotationCard";
import type { Comment, AnnotationType } from "../types";

const ALL_TYPES: AnnotationType[] = [
  "documentation", "pro", "question", "con", "suggestion", "critical", "user-insight",
];
const ALL_STATUSES: Comment["status"][] = ["Open", "In behandeling", "Opgelost"];
const STATUS_PILL_COLORS: Record<Comment["status"], { bg: string; text: string }> = {
  "Open": { bg: "#FEF3F2", text: "#B42318" },
  "In behandeling": { bg: "#FFF6ED", text: "#B93815" },
  "Opgelost": { bg: "#ECFDF3", text: "#067647" },
};

export function AnnotationPanel() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const {
    annotationMode,
    setAnnotationMode,
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
    commentsConfig,
    currentRoute,
  } = useAnnotations();

  const [view, setView] = useState<"annotations" | "feedback">("annotations");
  const [tab, setTab] = useState<"page" | "all">("page");
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<Set<AnnotationType>>(new Set());
  const [statusFilter, setStatusFilter] = useState<Set<Comment["status"]>>(new Set(["Open", "In behandeling"]));
  const [isDragging, setIsDragging] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const activeCardRef = useRef<HTMLDivElement>(null);

  const { panelWidth, panelHeight, zIndex, accentColor } = settings;

  const { comments: allFeedback, isLoading: feedbackLoading, error: feedbackError } = useAllComments({
    apiBase: commentsConfig?.apiBase ?? "",
    project: commentsConfig?.project ?? "",
    enabled: !!commentsConfig,
  });

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
  const filtered = sourceAnnotations.filter((a) => {
    if (typeFilter.size > 0 && !typeFilter.has(a.type ?? "documentation")) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!a.title.toLowerCase().includes(q) && !a.body.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const pageFeedback = allFeedback.filter((c) => c.pagina === currentRoute);
  const sourceFeedback = tab === "page" ? pageFeedback : allFeedback;
  const filteredFeedback = sourceFeedback.filter((c) => {
    if (statusFilter.size > 0 && !statusFilter.has(c.status)) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (
        !c.comment.toLowerCase().includes(q) &&
        !c.auteur.toLowerCase().includes(q) &&
        !(c.label ?? "").toLowerCase().includes(q)
      ) return false;
    }
    return true;
  });

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
          onClick: () => {
            // Move focus out before closing to prevent aria-hidden conflict on ancestor
            if (panelRef.current && panelRef.current.contains(document.activeElement)) {
              (document.activeElement as HTMLElement)?.blur();
            }
            setAnnotationMode(false);
          },
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

    // ── Top-level view tabs: Annotaties / Feedback ──
    React.createElement(
      "div",
      {
        style: {
          display: "flex",
          padding: "8px 14px 0",
          gap: 0,
          borderBottom: `1px solid ${PANEL_COLORS.border}`,
        } as React.CSSProperties,
      },
      ...(["annotations", "feedback"] as const).map((v) =>
        React.createElement(
          "button",
          {
            key: v,
            onClick: () => setView(v),
            style: {
              background: "transparent",
              border: "none",
              borderBottom: view === v ? `2px solid ${accentColor}` : "2px solid transparent",
              padding: "6px 14px 8px",
              cursor: "pointer",
              fontSize: 13,
              fontFamily: "inherit",
              fontWeight: view === v ? 600 : 400,
              color: view === v ? PANEL_COLORS.textPrimary : PANEL_COLORS.textMuted,
              transition: "all 0.15s ease",
            } as React.CSSProperties,
          },
          v === "annotations" ? "Annotaties" : "Feedback",
          v === "feedback" && pageFeedback.filter((c) => c.status !== "Opgelost").length > 0
            ? React.createElement(
                "span",
                {
                  style: {
                    marginLeft: 6,
                    fontSize: 10,
                    fontWeight: 600,
                    background: "#F2F4F7",
                    color: "#344054",
                    border: "1px solid #EAECF0",
                    borderRadius: 8,
                    padding: "1px 6px",
                  } as React.CSSProperties,
                },
                pageFeedback.filter((c) => c.status !== "Opgelost").length
              )
            : null
        )
      )
    ),

    // ── Sub-tabs: page / all (shared) ──
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
        {
          key: "page" as const,
          label: labels.tabCurrentPage,
          count: view === "annotations" ? currentAnnotations.length : pageFeedback.filter((c) => statusFilter.size === 0 || statusFilter.has(c.status)).length,
        },
        {
          key: "all" as const,
          label: labels.tabAll,
          count: view === "annotations" ? allAnnotations.length : allFeedback.filter((c) => statusFilter.size === 0 || statusFilter.has(c.status)).length,
        },
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
              color: tab === t.key ? PANEL_COLORS.textPrimary : PANEL_COLORS.textSecondary,
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

    // ── Search (shared) ──
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
        placeholder: view === "feedback" ? "Zoek feedback..." : labels.searchPlaceholder,
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

    // ── Filter pills ──
    React.createElement(
      "div",
      {
        style: {
          display: "flex",
          flexWrap: "wrap",
          gap: 4,
          padding: "0 14px 6px",
        } as React.CSSProperties,
      },
      ...(view === "annotations"
        ? ALL_TYPES.map((t) => {
            const active = typeFilter.has(t);
            const tc = TYPE_COLORS[t];
            const Icon = TYPE_ICONS[t];
            return React.createElement(
              "button",
              {
                key: t,
                onClick: () => {
                  setTypeFilter((prev) => {
                    const next = new Set(prev);
                    if (next.has(t)) next.delete(t); else next.add(t);
                    return next;
                  });
                },
                style: {
                  display: "flex",
                  alignItems: "center",
                  gap: 3,
                  fontSize: 10,
                  fontWeight: 500,
                  fontFamily: "inherit",
                  padding: "2px 8px",
                  borderRadius: 10,
                  border: `1px solid ${active ? tc.border : PANEL_COLORS.border}`,
                  background: active ? tc.bg : "transparent",
                  color: active ? tc.text : PANEL_COLORS.textMuted,
                  cursor: "pointer",
                  transition: "all 0.1s ease",
                } as React.CSSProperties,
              },
              React.createElement(Icon, { size: 10, color: active ? tc.text : PANEL_COLORS.textMuted }),
              t.charAt(0).toUpperCase() + t.slice(1)
            );
          })
        : ALL_STATUSES.map((s) => {
            const active = statusFilter.has(s);
            const sc = STATUS_PILL_COLORS[s];
            return React.createElement(
              "button",
              {
                key: s,
                onClick: () => {
                  setStatusFilter((prev) => {
                    const next = new Set(prev);
                    if (next.has(s)) next.delete(s); else next.add(s);
                    return next;
                  });
                },
                style: {
                  fontSize: 11,
                  fontWeight: 500,
                  fontFamily: "inherit",
                  padding: "2px 10px",
                  borderRadius: 10,
                  border: `1px solid ${active ? sc.text + "44" : PANEL_COLORS.border}`,
                  background: active ? sc.bg : "transparent",
                  color: active ? sc.text : PANEL_COLORS.textMuted,
                  cursor: "pointer",
                  transition: "all 0.1s ease",
                } as React.CSSProperties,
              },
              s
            );
          })
      )
    ),

    // ── List content ──
    view === "annotations"
      ? // Annotation list
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
      : // Feedback list
        React.createElement(
          "div",
          {
            style: {
              flex: 1,
              overflowY: "auto",
              padding: "4px 8px 8px",
              display: "flex",
              flexDirection: "column",
              gap: 6,
            } as React.CSSProperties,
          },
          feedbackLoading && filteredFeedback.length === 0
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
                "Feedback laden..."
              )
            : feedbackError && filteredFeedback.length === 0
              ? React.createElement(
                  "p",
                  {
                    style: {
                      textAlign: "center",
                      color: "#B42318",
                      fontSize: 12,
                      padding: "24px 0",
                    } as React.CSSProperties,
                  },
                  "Fout bij laden feedback"
                )
              : filteredFeedback.length === 0
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
                    "Nog geen feedback"
                  )
                : filteredFeedback.map((c: Comment) =>
                    React.createElement(
                      "div",
                      {
                        key: c.id,
                        onClick: () => {
                          if (!c.annotationId) return;
                          const el = findElementByAnnotationId(c.annotationId);
                          if (el) {
                            scrollToAndHighlight(el, zIndex);
                          }
                        },
                        style: {
                          padding: "10px 12px",
                          borderRadius: 6,
                          border: `1px solid ${PANEL_COLORS.border}`,
                          background: "#FFFFFF",
                          fontSize: 13,
                          cursor: c.annotationId ? "pointer" : "default",
                          transition: "border-color 0.15s ease",
                        } as React.CSSProperties,
                        onMouseEnter: (e: React.MouseEvent<HTMLDivElement>) => {
                          if (c.annotationId) {
                            e.currentTarget.style.borderColor = "#175CD3";
                            const el = findElementByAnnotationId(c.annotationId);
                            if (el) showHoverHighlight(el, zIndex);
                          }
                        },
                        onMouseLeave: (e: React.MouseEvent<HTMLDivElement>) => {
                          e.currentTarget.style.borderColor = PANEL_COLORS.border;
                          removeHoverHighlight();
                        },
                      },
                      // Label (element reference)
                      c.label && React.createElement(
                        "div",
                        {
                          style: {
                            fontSize: 11,
                            color: PANEL_COLORS.textMuted,
                            marginBottom: 4,
                            fontFamily: "monospace",
                          },
                        },
                        c.label
                      ),
                      // Header: author + status
                      React.createElement(
                        "div",
                        {
                          style: {
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            marginBottom: 4,
                          } as React.CSSProperties,
                        },
                        React.createElement(
                          "span",
                          {
                            style: {
                              fontWeight: 600,
                              color: PANEL_COLORS.textPrimary,
                              fontSize: 13,
                            },
                          },
                          c.auteur
                        ),
                        React.createElement(
                          "span",
                          {
                            style: {
                              fontSize: 11,
                              fontWeight: 500,
                              padding: "1px 6px",
                              borderRadius: 10,
                              background:
                                c.status === "Open" ? "#FEF3F2"
                                : c.status === "In behandeling" ? "#FFF6ED"
                                : "#ECFDF3",
                              color:
                                c.status === "Open" ? "#B42318"
                                : c.status === "In behandeling" ? "#B93815"
                                : "#067647",
                            } as React.CSSProperties,
                          },
                          c.status
                        )
                      ),
                      // Comment text
                      React.createElement(
                        "div",
                        {
                          style: {
                            color: PANEL_COLORS.textSecondary,
                            lineHeight: 1.4,
                            whiteSpace: "pre-wrap",
                          } as React.CSSProperties,
                        },
                        c.comment
                      ),
                      // Reply
                      c.antwoord
                        ? React.createElement(
                            "div",
                            {
                              style: {
                                marginTop: 6,
                                padding: "6px 8px",
                                borderRadius: 4,
                                background: "#F9FAFB",
                                borderLeft: "3px solid #D0D5DD",
                                fontSize: 13,
                                color: PANEL_COLORS.textSecondary,
                                lineHeight: 1.4,
                                whiteSpace: "pre-wrap",
                              } as React.CSSProperties,
                            },
                            React.createElement(
                              "span",
                              {
                                style: {
                                  fontWeight: 600,
                                  fontSize: 11,
                                  color: PANEL_COLORS.textMuted,
                                  display: "block",
                                  marginBottom: 2,
                                },
                              },
                              "Antwoord"
                            ),
                            c.antwoord
                          )
                        : null,
                      // Footer: page path (left) + author · date (right)
                      React.createElement(
                        "div",
                        {
                          style: {
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            fontSize: 11,
                            color: PANEL_COLORS.textMuted,
                            marginTop: 4,
                          } as React.CSSProperties,
                        },
                        // Page path (left)
                        React.createElement(
                          "span",
                          {
                            onClick: c.pagina ? (e: React.MouseEvent) => {
                              e.stopPropagation();
                              window.history.pushState(null, "", c.pagina!);
                              window.dispatchEvent(new PopStateEvent("popstate"));
                            } : undefined,
                            style: {
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              maxWidth: "60%",
                              cursor: c.pagina ? "pointer" : "default",
                              borderBottom: c.pagina ? "1px dashed currentColor" : "none",
                            } as React.CSSProperties,
                          },
                          c.pagina
                            ? c.pagina.replace(/^\//, "").split("/").filter(Boolean).join(" / ") || "global"
                            : ""
                        ),
                        // Date (right)
                        React.createElement(
                          "span",
                          { style: { flexShrink: 0 } as React.CSSProperties },
                          (() => {
                            try {
                              return new Date(c.aangemaakt).toLocaleDateString("nl-NL", {
                                day: "numeric",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit",
                              });
                            } catch {
                              return c.aangemaakt;
                            }
                          })()
                        )
                      )
                    )
                  )
        )
  );
}

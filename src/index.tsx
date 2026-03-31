/**
 * @{{ORG_NAME}}/annotations
 *
 * Centrale annotation engine — beheerd in dit package,
 * toegepast in elk project via npm.
 *
 * STRUCTUUR VAN DIT PACKAGE:
 *
 * packages/annotations/
 *   src/
 *     AnnotationProvider.tsx   ← Context + toggle state
 *     Annotatable.tsx          ← Wrapper component
 *     AnnotationBadge.tsx      ← De badge/tooltip UI
 *     AnnotationToggle.tsx     ← Floating toggle knop
 *     types.ts                 ← TypeScript types
 *     index.ts                 ← Public API exports
 *   package.json
 *   README.md
 *
 * PUBLICEREN:
 * npm publish --access restricted (GitHub Packages of eigen registry)
 *
 * UPDATEN IN PROJECTEN:
 * npm update @{{ORG_NAME}}/annotations
 * (of: npm install @{{ORG_NAME}}/annotations@latest)
 */

// ─── types.ts ────────────────────────────────────────────────────────────────

export interface Annotation {
  title: string;
  body: string;
  type?: "info" | "tip" | "warning" | "new";
}

export interface AnnotationConfig {
  project: string;
  settings?: {
    togglePosition?: "bottom-right" | "bottom-left" | "top-right" | "top-left";
    accentColor?: string;
    defaultVisible?: boolean;
  };
  annotations: Record<string, Annotation>;
}

// ─── AnnotationProvider.tsx ──────────────────────────────────────────────────

import React, { createContext, useContext, useState, useCallback } from "react";

interface AnnotationContextValue {
  visible: boolean;
  toggle: () => void;
  getAnnotation: (id: string) => Annotation | undefined;
  config: AnnotationConfig;
}

const AnnotationContext = createContext<AnnotationContextValue | null>(null);

export function AnnotationProvider({
  config,
  children,
}: {
  config: AnnotationConfig;
  children: React.ReactNode;
}) {
  const [visible, setVisible] = useState(
    config.settings?.defaultVisible ?? false
  );

  const toggle = useCallback(() => setVisible((v) => !v), []);

  const getAnnotation = useCallback(
    (id: string) => config.annotations[id],
    [config]
  );

  return (
    <AnnotationContext.Provider value={{ visible, toggle, getAnnotation, config }}>
      {children}
      <AnnotationToggle />
    </AnnotationContext.Provider>
  );
}

export function useAnnotations() {
  const ctx = useContext(AnnotationContext);
  if (!ctx) throw new Error("useAnnotations must be used within AnnotationProvider");
  return ctx;
}

// ─── Annotatable.tsx ─────────────────────────────────────────────────────────

export function Annotatable({
  id,
  children,
  className,
}: {
  id: string;
  children: React.ReactNode;
  className?: string;
}) {
  const { visible, getAnnotation } = useAnnotations();
  const annotation = getAnnotation(id);

  if (!visible || !annotation) {
    return <>{children}</>;
  }

  return (
    <div
      className={`annotation-wrapper ${className ?? ""}`}
      style={{ position: "relative", display: "contents" }}
    >
      {children}
      <AnnotationBadge annotation={annotation} />
    </div>
  );
}

// ─── AnnotationBadge.tsx ─────────────────────────────────────────────────────

const TYPE_ICONS = {
  info:    "ℹ",
  tip:     "★",
  warning: "⚠",
  new:     "✦",
} as const;

const TYPE_COLORS = {
  info:    { bg: "#EFF8FF", border: "#B2DDFF", text: "#175CD3" },
  tip:     { bg: "#F6FEF9", border: "#ABEFC6", text: "#067647" },
  warning: { bg: "#FFFAEB", border: "#FEDF89", text: "#B54708" },
  new:     { bg: "#F4F3FF", border: "#D9D6FE", text: "#5925DC" },
} as const;

function AnnotationBadge({ annotation }: { annotation: Annotation }) {
  const [expanded, setExpanded] = useState(false);
  const type = annotation.type ?? "info";
  const colors = TYPE_COLORS[type];

  return (
    <div
      style={{
        position: "absolute",
        top: -8,
        right: -8,
        zIndex: 9000,
      }}
    >
      {/* Badge trigger */}
      <button
        onClick={() => setExpanded((e) => !e)}
        style={{
          width: 20,
          height: 20,
          borderRadius: "50%",
          background: colors.bg,
          border: `1.5px solid ${colors.border}`,
          color: colors.text,
          fontSize: 10,
          fontWeight: 600,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        }}
        aria-label={`Annotatie: ${annotation.title}`}
      >
        {TYPE_ICONS[type]}
      </button>

      {/* Expanded tooltip */}
      {expanded && (
        <div
          style={{
            position: "absolute",
            top: 24,
            right: 0,
            width: 260,
            background: "#fff",
            border: `1px solid ${colors.border}`,
            borderRadius: 8,
            padding: "12px 14px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: 6,
            }}
          >
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: colors.text,
              }}
            >
              {annotation.title}
            </span>
            <button
              onClick={() => setExpanded(false)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: 14,
                color: "#98A2B3",
                lineHeight: 1,
                padding: 0,
              }}
            >
              ×
            </button>
          </div>
          <p style={{ fontSize: 12, color: "#344054", margin: 0, lineHeight: 1.5 }}>
            {annotation.body}
          </p>
        </div>
      )}
    </div>
  );
}

// ─── AnnotationToggle.tsx ─────────────────────────────────────────────────────

function AnnotationToggle() {
  const { visible, toggle, config } = useAnnotations();
  const position = config.settings?.togglePosition ?? "bottom-right";

  const positionStyles: Record<string, React.CSSProperties> = {
    "bottom-right": { bottom: 24, right: 24 },
    "bottom-left":  { bottom: 24, left: 24 },
    "top-right":    { top: 24, right: 24 },
    "top-left":     { top: 24, left: 24 },
  };

  return (
    <button
      onClick={toggle}
      title={visible ? "Annotaties verbergen" : "Annotaties tonen"}
      style={{
        position: "fixed",
        zIndex: 9999,
        ...positionStyles[position],
        height: 36,
        padding: "0 14px",
        borderRadius: 18,
        background: visible ? "#344054" : "#fff",
        color: visible ? "#fff" : "#344054",
        border: "1.5px solid #D0D5DD",
        fontSize: 12,
        fontWeight: 500,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: 6,
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        transition: "all 0.15s ease",
      }}
    >
      <span style={{ fontSize: 14 }}>◎</span>
      {visible ? "Annotaties verbergen" : "Annotaties tonen"}
    </button>
  );
}

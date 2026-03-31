import React, { createContext, useState, useCallback, useEffect, useMemo, useRef } from "react";
import type {
  AnnotationContextValue,
  AnnotationProviderProps,
  PanelCorner,
} from "../types";
import { DEFAULT_LABELS, DEFAULT_SETTINGS, STORAGE_KEY_PANEL_CORNER } from "../constants";
import { matchRoute } from "../utils/route-matching";

export const AnnotationContext = createContext<AnnotationContextValue | null>(null);

export function AnnotationProvider({
  annotations,
  currentRoute = "/",
  settings: settingsOverride,
  labels: labelsOverride,
  children,
}: AnnotationProviderProps) {
  const settings = useMemo(
    () => ({ ...DEFAULT_SETTINGS, ...settingsOverride }),
    [settingsOverride]
  );
  const labels = useMemo(
    () => ({ ...DEFAULT_LABELS, ...labelsOverride }),
    [labelsOverride]
  );

  const [annotationMode, setAnnotationMode] = useState(settings.defaultVisible);
  const [panelOpen, setPanelOpen] = useState(false);
  const [panelCorner, setPanelCornerState] = useState<PanelCorner>(() => {
    if (typeof window === "undefined") return settings.togglePosition;
    try {
      const stored = localStorage.getItem(STORAGE_KEY_PANEL_CORNER);
      if (stored) return stored as PanelCorner;
    } catch {}
    return settings.togglePosition;
  });
  const [activeAnnotationId, setActiveAnnotationId] = useState<string | null>(null);
  const [hoveredAnnotationId, setHoveredAnnotationId] = useState<string | null>(null);
  const [contextStack, setContextStack] = useState<string[]>([]);

  const contextStackRef = useRef(contextStack);
  contextStackRef.current = contextStack;

  const setPanelCorner = useCallback((corner: PanelCorner) => {
    setPanelCornerState(corner);
    try {
      localStorage.setItem(STORAGE_KEY_PANEL_CORNER, corner);
    } catch {}
  }, []);

  const pushContext = useCallback((context: string) => {
    setContextStack((prev) => [...prev, context]);
  }, []);

  const popContext = useCallback(() => {
    setContextStack((prev) => prev.slice(0, -1));
  }, []);

  // Warn when currentRoute is not provided but annotations have route targets
  useEffect(() => {
    if (
      currentRoute === "/" &&
      annotations.some((a) => a.target !== "global" && a.target !== "/")
    ) {
      console.warn(
        '[@jasperdenouden92/annotations] currentRoute prop is not set on AnnotationProvider, ' +
        'but some annotations have route-specific targets. The "current page" filter will not work correctly. ' +
        'Pass currentRoute={window.location.pathname} or your router\'s current path.'
      );
    }
  }, []);

  // Clear context stack on route change
  const prevRouteRef = useRef(currentRoute);
  useEffect(() => {
    if (prevRouteRef.current !== currentRoute) {
      setContextStack([]);
      prevRouteRef.current = currentRoute;
    }
  }, [currentRoute]);

  // Close panel when annotation mode is turned off
  useEffect(() => {
    if (!annotationMode) {
      setPanelOpen(false);
      setActiveAnnotationId(null);
    }
  }, [annotationMode]);

  // Keyboard shortcut: Cmd+. / Ctrl+.
  useEffect(() => {
    if (!settings.keyboardShortcut) return;

    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === ".") {
        e.preventDefault();
        setAnnotationMode((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [settings.keyboardShortcut]);

  const currentContext = contextStack.length > 0
    ? contextStack[contextStack.length - 1]
    : currentRoute;

  const currentAnnotations = useMemo(
    () =>
      annotations.filter(
        (a) =>
          matchRoute(a.target, currentContext) ||
          a.target === "global"
      ),
    [annotations, currentContext]
  );

  const value = useMemo<AnnotationContextValue>(
    () => ({
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
      allAnnotations: annotations,
      pushContext,
      popContext,
      labels,
      settings,
    }),
    [
      annotationMode,
      panelOpen,
      panelCorner,
      setPanelCorner,
      activeAnnotationId,
      hoveredAnnotationId,
      currentAnnotations,
      annotations,
      pushContext,
      popContext,
      labels,
      settings,
    ]
  );

  return React.createElement(AnnotationContext.Provider, { value }, children);
}

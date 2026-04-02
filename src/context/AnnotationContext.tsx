import React, { createContext, useState, useCallback, useEffect, useMemo, useRef, useReducer } from "react";
import type {
  AnnotationContextValue,
  AnnotationProviderProps,
  PanelCorner,
} from "../types";
import { DEFAULT_LABELS, DEFAULT_SETTINGS, STORAGE_KEY_PANEL_CORNER } from "../constants";
import { matchRoute } from "../utils/route-matching";
import { Inspector } from "../components/Inspector";
import { FeedbackMarkers } from "../components/FeedbackMarkers";
import { AutoAnnotationMarkers } from "../components/AutoAnnotationMarkers";
import { useAllComments } from "../hooks/useAllComments";

export const AnnotationContext = createContext<AnnotationContextValue | null>(null);

export function AnnotationProvider({
  annotations,
  currentRoute = "/",
  settings: settingsOverride,
  labels: labelsOverride,
  comments: commentsConfig,
  children,
}: AnnotationProviderProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const settings = useMemo(
    () => ({ ...DEFAULT_SETTINGS, ...settingsOverride }),
    [settingsOverride]
  );
  const labels = useMemo(
    () => ({ ...DEFAULT_LABELS, ...labelsOverride }),
    [labelsOverride]
  );

  const [annotationMode, setAnnotationMode] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [panelCorner, setPanelCornerState] = useState<PanelCorner>(settings.togglePosition);

  // Apply defaultVisible and restore panel corner from localStorage after mount
  useEffect(() => {
    setAnnotationMode(settings.defaultVisible);
    try {
      const stored = localStorage.getItem(STORAGE_KEY_PANEL_CORNER);
      if (stored) setPanelCornerState(stored as PanelCorner);
    } catch {}
  }, []);
  const [activeAnnotationId, setActiveAnnotationId] = useState<string | null>(null);
  const [hoveredAnnotationId, setHoveredAnnotationId] = useState<string | null>(null);
  const [inspectorActive, setInspectorActive] = useState(false);
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

  // Close panel and inspector when annotation mode is turned off
  useEffect(() => {
    if (!annotationMode) {
      setPanelOpen(false);
      setActiveAnnotationId(null);
      setInspectorActive(false);
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

  // Track which annotation IDs are rendered by AnnotationMarker wrappers
  const [registeredMarkerIds, setRegisteredMarkerIds] = useState<Set<string>>(() => new Set());
  // Force re-render counter so consumers see registration changes
  const [, forceUpdate] = useReducer((x: number) => x + 1, 0);

  const registerMarkerId = useCallback((id: string) => {
    setRegisteredMarkerIds((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      return next;
    });
    forceUpdate();
  }, []);

  const unregisterMarkerId = useCallback((id: string) => {
    setRegisteredMarkerIds((prev) => {
      if (!prev.has(id)) return prev;
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    forceUpdate();
  }, []);

  const { comments: allComments } = useAllComments({
    apiBase: commentsConfig?.apiBase ?? "",
    project: commentsConfig?.project ?? "",
    enabled: !!commentsConfig?.enabled && (annotationMode || inspectorActive),
  });

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
      inspectorActive,
      setInspectorActive,
      currentAnnotations,
      allAnnotations: annotations,
      pushContext,
      popContext,
      labels,
      settings,
      commentsConfig: commentsConfig?.enabled ? commentsConfig : null,
      allComments,
      currentRoute,
      registeredMarkerIds,
      registerMarkerId,
      unregisterMarkerId,
    }),
    [
      annotationMode,
      panelOpen,
      panelCorner,
      setPanelCorner,
      activeAnnotationId,
      hoveredAnnotationId,
      inspectorActive,
      currentAnnotations,
      annotations,
      pushContext,
      popContext,
      labels,
      settings,
      commentsConfig,
      allComments,
      currentRoute,
      registeredMarkerIds,
      registerMarkerId,
      unregisterMarkerId,
    ]
  );

  return React.createElement(
    AnnotationContext.Provider,
    { value },
    children,
    mounted && commentsConfig?.enabled ? React.createElement(Inspector) : null,
    mounted && commentsConfig?.enabled ? React.createElement(FeedbackMarkers) : null,
    mounted ? React.createElement(AutoAnnotationMarkers) : null
  );
}

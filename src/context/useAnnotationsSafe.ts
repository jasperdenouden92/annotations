import { useContext } from "react";
import { AnnotationContext } from "./AnnotationContext";
import type { AnnotationContextValue } from "../types";
import { DEFAULT_LABELS, DEFAULT_SETTINGS } from "../constants";

const NOOP_CONTEXT: AnnotationContextValue = {
  annotationMode: false,
  setAnnotationMode: () => {},
  panelOpen: false,
  setPanelOpen: () => {},
  panelCorner: "bottom-right",
  setPanelCorner: () => {},
  activeAnnotationId: null,
  setActiveAnnotationId: () => {},
  hoveredAnnotationId: null,
  setHoveredAnnotationId: () => {},
  inspectorActive: false,
  setInspectorActive: () => {},
  currentAnnotations: [],
  allAnnotations: [],
  pushContext: () => {},
  popContext: () => {},
  labels: DEFAULT_LABELS,
  settings: DEFAULT_SETTINGS,
  commentsConfig: null,
  allComments: [],
  currentRoute: "/",
};

export function useAnnotationsSafe(): AnnotationContextValue {
  const ctx = useContext(AnnotationContext);
  return ctx ?? NOOP_CONTEXT;
}

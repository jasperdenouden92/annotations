export type PanelCorner = "top-left" | "top-right" | "bottom-left" | "bottom-right";
export type MarkerPosition = "top-left" | "top-right" | "bottom-left" | "bottom-right";
export type AnnotationType = "documentation" | "pro" | "question" | "con" | "suggestion" | "critical" | "user-insight";

export interface Annotation {
  id: string;
  target: string;
  elementId?: string;
  title: string;
  body: string;
  author: string;
  date: string;
  type?: AnnotationType;
}

export interface AnnotationSettings {
  togglePosition?: PanelCorner;
  defaultVisible?: boolean;
  accentColor?: string;
  panelWidth?: number;
  panelHeight?: number;
  zIndex?: number;
  keyboardShortcut?: boolean;
}

export interface AnnotationLabels {
  toggleShow: string;
  toggleHide: string;
  tabCurrentPage: string;
  tabAll: string;
  searchPlaceholder: string;
  panelTitle: string;
  noResults: string;
}

export interface AnnotationContextValue {
  annotationMode: boolean;
  setAnnotationMode: (value: boolean) => void;
  panelOpen: boolean;
  setPanelOpen: (value: boolean) => void;
  panelCorner: PanelCorner;
  setPanelCorner: (corner: PanelCorner) => void;
  activeAnnotationId: string | null;
  setActiveAnnotationId: (id: string | null) => void;
  hoveredAnnotationId: string | null;
  setHoveredAnnotationId: (id: string | null) => void;
  currentAnnotations: Annotation[];
  allAnnotations: Annotation[];
  pushContext: (context: string) => void;
  popContext: () => void;
  labels: AnnotationLabels;
  settings: Required<AnnotationSettings>;
}

export interface AnnotationProviderProps {
  annotations: Annotation[];
  currentRoute?: string;
  settings?: AnnotationSettings;
  labels?: Partial<AnnotationLabels>;
  children: React.ReactNode;
}

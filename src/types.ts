export type PanelCorner = "top-left" | "top-right" | "bottom-left" | "bottom-right";
export type MarkerPosition = "top-left" | "top-right" | "bottom-left" | "bottom-right";
export type AnnotationType = "documentation" | "info" | "tip" | "pro" | "question" | "con" | "suggestion" | "critical" | "user-insight";

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
  commentsConfig: CommentsConfig | null;
}

export interface AnnotationProviderProps {
  annotations: Annotation[];
  currentRoute?: string;
  settings?: AnnotationSettings;
  labels?: Partial<AnnotationLabels>;
  comments?: CommentsConfig;
  children: React.ReactNode;
}

export type CommentStatus =
  | "Open"
  | "In behandeling"
  | "In review"
  | "Opgelost"
  | "Afgewezen";

export interface Comment {
  id: string;
  auteur: string;
  comment: string;
  status: CommentStatus;
  antwoord: string | null;
  aangemaakt: string;
  /** React component name of the clicked element (dev/staging builds only). */
  component?: string;
  /** Source location `path/to/File.tsx:line` of the clicked element (dev/staging builds only). */
  bron?: string;
  /** Link to the pull request that addresses this comment, if any. */
  pr?: string;
}

export interface CommentsConfig {
  enabled: boolean;
  apiBase: string;
  project: string;
  /**
   * Capture the React component name and source file of the clicked element
   * and send them along with the comment. Defaults to `true`; a no-op in
   * production builds where the source attributes are not present.
   */
  captureSource?: boolean;
}

/**
 * A single piece of client feedback, as consumed by the `orbit-feedback` CLI
 * and any downstream automation. Mirrors the Notion database row.
 */
export interface FeedbackItem {
  /** Notion page id. */
  id: string;
  project: string;
  /** CSS element path or annotation id the comment was attached to. */
  annotationId: string;
  label: string;
  pagina: string;
  auteur: string;
  comment: string;
  component: string;
  bron: string;
  status: CommentStatus;
  antwoord: string | null;
  pr: string;
  /** Notion `created_time`. */
  aangemaakt: string;
}

export interface AnnotationConfig {
  project: string;
  annotations: Annotation[];
  settings?: AnnotationSettings;
  comments?: CommentsConfig;
}

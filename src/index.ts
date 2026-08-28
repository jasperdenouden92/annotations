// Components
export { AnnotationProvider } from "./context/annotation-context";
export { AnnotationButton } from "./components/annotation-button";
export { AnnotationMarker } from "./components/annotation-marker";
export { AnnotationPanel } from "./components/annotation-panel";
export { CommentThread } from "./components/comment-thread";
export { CommentForm } from "./components/comment-form";
export { Inspector } from "./components/inspector";

// Hooks
export { useAnnotations } from "./context/use-annotations";
export { useAnnotationsSafe } from "./context/use-annotations-safe";
export { useComments } from "./hooks/use-comments";
export { useAllComments } from "./hooks/use-all-comments";

// Theming — the CSS custom properties are a public contract; see CLAUDE.md.
export { THEME_ATTR } from "./styles/tokens";
export { onBrandTextColor } from "./styles/brand";

// Types
export type {
  Annotation,
  AnnotationConfig,
  AnnotationProviderProps,
  AnnotationLabels,
  AnnotationSettings,
  AnnotationContextValue,
  AnnotationType,
  PanelCorner,
  MarkerPosition,
  Comment,
  CommentsConfig,
} from "./types";

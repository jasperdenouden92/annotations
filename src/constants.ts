import type { AnnotationLabels, AnnotationSettings, AnnotationType } from "./types";
import {
  FileTextIcon, ThumbsUpIcon,
  HelpCircleIcon, ThumbsDownIcon, SparklesIcon, AlertTriangleIcon, EyeIcon,
} from "./icons";

export const TYPE_ICONS: Record<AnnotationType, typeof FileTextIcon> = {
  documentation: FileTextIcon,
  pro: ThumbsUpIcon,
  question: HelpCircleIcon,
  con: ThumbsDownIcon,
  suggestion: SparklesIcon,
  critical: AlertTriangleIcon,
  "user-insight": EyeIcon,
};

export const DEFAULT_LABELS: AnnotationLabels = {
  toggleShow: "Annotaties tonen",
  toggleHide: "Annotaties verbergen",
  tabCurrentPage: "Deze pagina",
  tabAll: "Alles",
  searchPlaceholder: "Zoek annotaties...",
  panelTitle: "Annotaties & Feedback",
  noResults: "Geen resultaten",
};

export const DEFAULT_SETTINGS: Required<AnnotationSettings> = {
  togglePosition: "bottom-right",
  defaultVisible: false,
  accentColor: "#344054",
  panelWidth: 420,
  panelHeight: 640,
  zIndex: 9000,
  keyboardShortcut: true,
};

export const STORAGE_KEY_PANEL_CORNER = "@jasperdenouden92/annotations:panelCorner";

// Colours live in src/styles/tokens.ts as CSS custom properties. Nothing here
// should carry a colour value: the check:tokens script fails the build if it does.

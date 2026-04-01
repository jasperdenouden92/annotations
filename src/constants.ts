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

export const TYPE_COLORS: Record<AnnotationType, { bg: string; border: string; text: string }> = {
  documentation: { bg: "#F5F5F5", border: "#D0D5DD", text: "#344054" },
  pro:           { bg: "#ECFDF3", border: "#ABEFC6", text: "#067647" },
  question:      { bg: "#EFF8FF", border: "#B2DDFF", text: "#175CD3" },
  con:           { bg: "#FEF3F2", border: "#FECDCA", text: "#B42318" },
  suggestion:    { bg: "#F4F3FF", border: "#D9D6FE", text: "#5925DC" },
  critical:      { bg: "#FFF4ED", border: "#F9DBAF", text: "#B93815" },
  "user-insight": { bg: "#FDF2FA", border: "#FCCEEE", text: "#C11574" },
};

export const PANEL_COLORS = {
  bg: "#FFFFFF",
  bgHover: "#F9FAFB",
  bgActive: "#F2F4F7",
  border: "#EAECF0",
  textPrimary: "#101828",
  textSecondary: "#475467",
  textMuted: "#98A2B3",
};

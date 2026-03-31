import { useContext } from "react";
import { AnnotationContext } from "./AnnotationContext";
import type { AnnotationContextValue } from "../types";

export function useAnnotations(): AnnotationContextValue {
  const ctx = useContext(AnnotationContext);
  if (!ctx) {
    throw new Error("useAnnotations must be used within an <AnnotationProvider>");
  }
  return ctx;
}

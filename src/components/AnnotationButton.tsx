import React, { useState, useEffect } from "react";
import { useAnnotations } from "../context/useAnnotations";
import { getButtonPosition } from "../utils/drag";
import { MessageSquareTextIcon } from "../icons";

export function AnnotationButton() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const {
    annotationMode,
    setAnnotationMode,
    panelOpen,
    setPanelOpen,
    panelCorner,
    currentAnnotations,
    labels,
    settings,
  } = useAnnotations();

  if (!mounted) return null;

  const count = currentAnnotations.length;
  const accent = settings.accentColor;

  const handleClick = () => {
    if (!annotationMode) {
      setAnnotationMode(true);
      setPanelOpen(true);
    } else {
      setPanelOpen(!panelOpen);
    }
  };

  return React.createElement(
    "button",
    {
      onClick: handleClick,
      title: annotationMode ? labels.toggleHide : labels.toggleShow,
      "aria-label": annotationMode ? labels.toggleHide : labels.toggleShow,
      style: {
        ...getButtonPosition(panelCorner),
        zIndex: settings.zIndex + 999,
        width: 40,
        height: 40,
        borderRadius: 10,
        background: annotationMode ? "#101828" : "#FFFFFF",
        color: annotationMode ? "#FFFFFF" : "#344054",
        border: `1px solid ${annotationMode ? "#101828" : "#D0D5DD"}`,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 1px 2px rgba(16,24,40,0.05), 0 1px 3px rgba(16,24,40,0.1)",
        transition: "all 0.15s ease",
      } as React.CSSProperties,
    },
    React.createElement(MessageSquareTextIcon, {
      size: 20,
      color: annotationMode ? "#FFFFFF" : "#667085",
    }),
    count > 0 &&
      annotationMode &&
      React.createElement(
        "span",
        {
          style: {
            position: "absolute",
            top: -6,
            right: -6,
            minWidth: 18,
            height: 18,
            borderRadius: 9,
            background: "#101828",
            border: "2px solid #FFFFFF",
            color: "#FFFFFF",
            fontSize: 10,
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "0 4px",
          } as React.CSSProperties,
        },
        count
      )
  );
}

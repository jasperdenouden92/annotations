import React from "react";

interface IconProps {
  size?: number;
  color?: string;
}

export function MessageSquareTextIcon({ size = 16, color = "currentColor" }: IconProps) {
  return React.createElement("svg", {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: color,
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
  },
    React.createElement("path", { d: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" }),
    React.createElement("path", { d: "M13 8H7" }),
    React.createElement("path", { d: "M17 12H7" }),
  );
}

export function MapPinIcon({ size = 16, color = "currentColor" }: IconProps) {
  return React.createElement("svg", {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: color,
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
  },
    React.createElement("path", { d: "M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" }),
    React.createElement("circle", { cx: 12, cy: 10, r: 3 }),
  );
}

export function XIcon({ size = 16, color = "currentColor" }: IconProps) {
  return React.createElement("svg", {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: color,
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
  },
    React.createElement("path", { d: "M18 6 6 18" }),
    React.createElement("path", { d: "m6 6 12 12" }),
  );
}

export function SearchIcon({ size = 16, color = "currentColor" }: IconProps) {
  return React.createElement("svg", {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: color,
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
  },
    React.createElement("circle", { cx: 11, cy: 11, r: 8 }),
    React.createElement("path", { d: "m21 21-4.3-4.3" }),
  );
}

export function GripVerticalIcon({ size = 16, color = "currentColor" }: IconProps) {
  return React.createElement("svg", {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: color,
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
  },
    React.createElement("circle", { cx: 9, cy: 12, r: 1 }),
    React.createElement("circle", { cx: 9, cy: 5, r: 1 }),
    React.createElement("circle", { cx: 9, cy: 19, r: 1 }),
    React.createElement("circle", { cx: 15, cy: 12, r: 1 }),
    React.createElement("circle", { cx: 15, cy: 5, r: 1 }),
    React.createElement("circle", { cx: 15, cy: 19, r: 1 }),
  );
}

// ── Annotation type icons ──

export function FileTextIcon({ size = 16, color = "currentColor" }: IconProps) {
  return React.createElement("svg", {
    width: size, height: size, viewBox: "0 0 24 24", fill: "none",
    stroke: color, strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round",
  },
    React.createElement("path", { d: "M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" }),
    React.createElement("path", { d: "M14 2v4a2 2 0 0 0 2 2h4" }),
    React.createElement("path", { d: "M10 13H8" }),
    React.createElement("path", { d: "M16 17H8" }),
    React.createElement("path", { d: "M16 13h-2" }),
  );
}

export function ThumbsUpIcon({ size = 16, color = "currentColor" }: IconProps) {
  return React.createElement("svg", {
    width: size, height: size, viewBox: "0 0 24 24", fill: "none",
    stroke: color, strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round",
  },
    React.createElement("path", { d: "M7 10v12" }),
    React.createElement("path", { d: "M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z" }),
  );
}

export function HelpCircleIcon({ size = 16, color = "currentColor" }: IconProps) {
  return React.createElement("svg", {
    width: size, height: size, viewBox: "0 0 24 24", fill: "none",
    stroke: color, strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round",
  },
    React.createElement("circle", { cx: 12, cy: 12, r: 10 }),
    React.createElement("path", { d: "M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" }),
    React.createElement("path", { d: "M12 17h.01" }),
  );
}

export function ThumbsDownIcon({ size = 16, color = "currentColor" }: IconProps) {
  return React.createElement("svg", {
    width: size, height: size, viewBox: "0 0 24 24", fill: "none",
    stroke: color, strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round",
  },
    React.createElement("path", { d: "M17 14V2" }),
    React.createElement("path", { d: "M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22a3.13 3.13 0 0 1-3-3.88Z" }),
  );
}

export function SparklesIcon({ size = 16, color = "currentColor" }: IconProps) {
  return React.createElement("svg", {
    width: size, height: size, viewBox: "0 0 24 24", fill: "none",
    stroke: color, strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round",
  },
    React.createElement("path", { d: "m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z" }),
  );
}

export function AlertTriangleIcon({ size = 16, color = "currentColor" }: IconProps) {
  return React.createElement("svg", {
    width: size, height: size, viewBox: "0 0 24 24", fill: "none",
    stroke: color, strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round",
  },
    React.createElement("path", { d: "m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" }),
    React.createElement("path", { d: "M12 9v4" }),
    React.createElement("path", { d: "M12 17h.01" }),
  );
}

export function EyeIcon({ size = 16, color = "currentColor" }: IconProps) {
  return React.createElement("svg", {
    width: size, height: size, viewBox: "0 0 24 24", fill: "none",
    stroke: color, strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round",
  },
    React.createElement("path", { d: "M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" }),
    React.createElement("circle", { cx: 12, cy: 12, r: 3 }),
  );
}

export function CrosshairIcon({ size = 16, color = "currentColor" }: IconProps) {
  return React.createElement("svg", {
    width: size, height: size, viewBox: "0 0 24 24", fill: "none",
    stroke: color, strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round",
  },
    React.createElement("circle", { cx: 12, cy: 12, r: 10 }),
    React.createElement("line", { x1: 22, y1: 12, x2: 18, y2: 12 }),
    React.createElement("line", { x1: 6, y1: 12, x2: 2, y2: 12 }),
    React.createElement("line", { x1: 12, y1: 6, x2: 12, y2: 2 }),
    React.createElement("line", { x1: 12, y1: 22, x2: 12, y2: 18 }),
  );
}

export function ChevronRightIcon({ size = 16, color = "currentColor" }: IconProps) {
  return React.createElement("svg", {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: color,
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
  },
    React.createElement("path", { d: "m9 18 6-6-6-6" }),
  );
}

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

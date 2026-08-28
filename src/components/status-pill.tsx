import React from "react";
import { STATUS_SLUGS } from "../styles/tokens";
import type { Comment } from "../types";

interface StatusPillProps {
  status: Comment["status"];
}

/** The single source for how a comment status looks, in the panel and in a thread. */
export function StatusPill({ status }: StatusPillProps) {
  return React.createElement(
    "span",
    { className: "szan-status", "data-szan-status": STATUS_SLUGS[status] },
    status
  );
}

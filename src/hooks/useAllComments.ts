import { useState, useEffect, useCallback, useRef } from "react";
import type { Comment } from "../types";

interface UseAllCommentsProps {
  apiBase: string;
  project: string;
  enabled: boolean;
}

interface UseAllCommentsReturn {
  comments: Comment[];
  isLoading: boolean;
  error: string | null;
}

export function useAllComments({
  apiBase: apiBaseProp,
  project,
  enabled,
}: UseAllCommentsProps): UseAllCommentsReturn {
  const [apiBase, setApiBase] = useState(apiBaseProp || "");
  const [comments, setComments] = useState<Comment[]>([]);

  useEffect(() => {
    if (!apiBaseProp) setApiBase(window.location.origin);
  }, [apiBaseProp]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const failedRef = useRef(false);
  const warnedRef = useRef(false);

  const fetchComments = useCallback(async () => {
    if (!enabled || failedRef.current) return;

    const url = `${apiBase}/api/comments?project=${encodeURIComponent(project)}`;

    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: Comment[] = await res.json();
      setComments(data);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Fout bij ophalen feedback";
      setError(message);
      failedRef.current = true;
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (!warnedRef.current) {
        warnedRef.current = true;
        console.warn(`[@jasperdenouden92/annotations] Comments API niet beschikbaar: ${message}`);
      }
    }
  }, [apiBase, project, enabled]);

  useEffect(() => {
    if (!enabled) {
      setComments([]);
      return;
    }

    setIsLoading(true);
    fetchComments().finally(() => setIsLoading(false));

    intervalRef.current = setInterval(fetchComments, 30_000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchComments, enabled]);

  return { comments, isLoading, error };
}

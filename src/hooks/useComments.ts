import { useState, useEffect, useCallback, useRef } from "react";
import type { Comment } from "../types";

interface UseCommentsProps {
  apiBase: string;
  project: string;
  annotationId: string;
  label: string;
  enabled: boolean;
}

interface UseCommentsReturn {
  comments: Comment[];
  isLoading: boolean;
  error: string | null;
  submitComment: (data: { auteur: string; comment: string }) => Promise<void>;
}

export function useComments({
  apiBase: apiBaseProp,
  project,
  annotationId,
  label,
  enabled,
}: UseCommentsProps): UseCommentsReturn {
  const apiBase = apiBaseProp || (typeof window !== "undefined" ? window.location.origin : "");
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const failedRef = useRef(false);
  const warnedRef = useRef(false);

  const fetchComments = useCallback(async () => {
    if (!enabled || failedRef.current) return;

    const url = `${apiBase}/api/comments?project=${encodeURIComponent(project)}&annotationId=${encodeURIComponent(annotationId)}`;

    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: Comment[] = await res.json();
      setComments(data);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Fout bij ophalen comments";
      setError(message);
      failedRef.current = true;
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (!warnedRef.current) {
        warnedRef.current = true;
        console.warn(`[@jasperdenouden92/annotations] Comments API niet beschikbaar: ${message}`);
      }
    }
  }, [apiBase, project, annotationId, enabled]);

  useEffect(() => {
    if (!enabled) {
      setComments([]);
      return;
    }

    failedRef.current = false;
    setIsLoading(true);
    fetchComments().finally(() => setIsLoading(false));

    intervalRef.current = setInterval(fetchComments, 30_000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchComments, enabled]);

  const submitComment = useCallback(
    async (data: { auteur: string; comment: string }) => {
      const url = `${apiBase}/api/comments`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project,
          annotationId,
          auteur: data.auteur,
          comment: data.comment,
          pagina: typeof window !== "undefined" ? window.location.pathname : "/",
          label,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await fetchComments();
    },
    [apiBase, project, annotationId, fetchComments]
  );

  return { comments, isLoading, error, submitComment };
}

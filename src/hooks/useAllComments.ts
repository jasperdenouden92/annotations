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
  const apiBase = apiBaseProp || (typeof window !== "undefined" ? window.location.origin : "");
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchComments = useCallback(async () => {
    if (!enabled) return;

    const url = `${apiBase}/api/comments?project=${encodeURIComponent(project)}`;

    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: Comment[] = await res.json();
      setComments(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fout bij ophalen feedback");
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

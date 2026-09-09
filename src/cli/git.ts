import { run, tryRun } from "./util";

export const TRAILER = "Orbit-Feedback";
export const REVERT_TRAILER = "Orbit-Feedback-Revert";
export const NOTE_TRAILER = "Kanttekening";

export interface FeedbackCommit {
  sha: string;
  shortSha: string;
  subject: string;
  feedbackId?: string;
  revertId?: string;
  /** `Kanttekening: ...` lines the bot left in the commit body. */
  notes: string[];
}

/**
 * Resolves `base` to a ref that actually exists in this checkout. A CI checkout
 * of just the feedback branch has no local `main` — only `origin/main` — so
 * `main..HEAD` is an ambiguous argument. Prefer `origin/<base>`, fall back to the
 * bare name for local runs. Never returns a name that doesn't resolve to a commit.
 */
export function resolveBaseRef(base: string): string {
  for (const ref of [`origin/${base}`, base]) {
    const r = tryRun("git", ["rev-parse", "--verify", "--quiet", `${ref}^{commit}`]);
    if (r.ok && r.stdout) return ref;
  }
  return base;
}

/**
 * Lists commits on the current branch since `base`, tagged with their Orbit
 * feedback trailers. Newest first.
 */
export function listFeedbackCommits(base: string): FeedbackCommit[] {
  const baseRef = resolveBaseRef(base);
  // %H hash, %x00 NUL, %s subject, %x00 NUL, %b body, %x1e record separator.
  const raw = run("git", [
    "log",
    `${baseRef}..HEAD`,
    "--format=%H%x00%s%x00%b%x1e",
  ]);
  if (!raw) return [];

  const records = raw.split("\x1e").map((r) => r.trim()).filter(Boolean);
  return records.map((record) => {
    const [sha, subject, body = ""] = record.split("\x00");
    return {
      sha,
      shortSha: sha.slice(0, 7),
      subject: subject ?? "",
      feedbackId: trailerValue(body, TRAILER),
      revertId: trailerValue(body, REVERT_TRAILER),
      notes: trailerValues(body, NOTE_TRAILER),
    };
  });
}

function trailerValue(body: string, key: string): string | undefined {
  const re = new RegExp(`^${key}:\\s*(.+)$`, "im");
  const m = body.match(re);
  return m ? m[1].trim() : undefined;
}

/** All values for a line-anchored `key: ...` trailer (a commit may have several). */
function trailerValues(body: string, key: string): string[] {
  const re = new RegExp(`^${key}:\\s*(.+)$`, "gim");
  const out: string[] = [];
  for (const m of body.matchAll(re)) out.push(m[1].trim());
  return out;
}

/** Ids that have a live (non-reverted) processing commit, mapped to that commit. */
export function liveFeedback(commits: FeedbackCommit[]): Map<string, FeedbackCommit> {
  const reverted = new Set(commits.map((c) => c.revertId).filter(Boolean) as string[]);
  const live = new Map<string, FeedbackCommit>();
  for (const c of commits) {
    if (c.feedbackId && !reverted.has(c.feedbackId) && !live.has(c.feedbackId)) {
      live.set(c.feedbackId, c);
    }
  }
  return live;
}

export interface RevertResult {
  id: string;
  sha: string;
  ok: boolean;
  reason?: string;
}

/**
 * Reverts `sha`, adding a `Orbit-Feedback-Revert: <id>` trailer. On conflict it
 * aborts the revert cleanly and returns `ok: false`.
 */
export function revert(sha: string, id: string): RevertResult {
  const attempt = tryRun("git", ["revert", "--no-edit", "--no-commit", sha]);
  if (!attempt.ok) {
    tryRun("git", ["revert", "--abort"]);
    tryRun("git", ["reset", "--hard", "HEAD"]);
    return { id, sha, ok: false, reason: attempt.stderr || "revert conflict" };
  }

  const message = `revert(feedback): ${id}\n\nAutomatisch teruggedraaid: feedbackpunt uitgevinkt in de PR.\n\n${REVERT_TRAILER}: ${id}`;
  const commit = tryRun("git", ["commit", "-m", message]);
  if (!commit.ok) {
    tryRun("git", ["reset", "--hard", "HEAD"]);
    return { id, sha, ok: false, reason: commit.stderr || "commit failed" };
  }
  return { id, sha, ok: true };
}

/** True when the working tree has no uncommitted changes. */
export function isClean(): boolean {
  return run("git", ["status", "--porcelain"]).length === 0;
}

/** The repository's current branch name. */
export function currentBranch(): string {
  return run("git", ["rev-parse", "--abbrev-ref", "HEAD"]);
}

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { listFeedbackCommits, resolveBaseRef } from "../git";

const FEEDBACK_ID = "11111111-1111-1111-1111-111111111111";
const FEEDBACK_BRANCH = "feedback/2026-09-09";

function git(cwd: string, args: string[]): string {
  return execFileSync("git", args, { cwd, encoding: "utf8" }).trim();
}

/**
 * Reproduces the CI condition that broke sync: a checkout of only the feedback
 * branch, where the base branch exists as `origin/main` but not as a local
 * `main`. `git log main..HEAD` is ambiguous there; `origin/main..HEAD` is not.
 */
describe("listFeedbackCommits without a local base branch", () => {
  let root: string;
  let consumer: string;
  const originalCwd = process.cwd();

  beforeAll(() => {
    root = mkdtempSync(join(tmpdir(), "orbit-git-"));
    const origin = join(root, "origin.git");
    const seed = join(root, "seed");
    consumer = join(root, "consumer");

    execFileSync("git", ["init", "--bare", "-b", "main", origin]);
    execFileSync("git", ["init", "-b", "main", seed]);
    git(seed, ["config", "user.email", "t@t.nl"]);
    git(seed, ["config", "user.name", "Test"]);
    git(seed, ["commit", "--allow-empty", "-m", "base"]);
    git(seed, ["remote", "add", "origin", origin]);
    git(seed, ["push", "-q", "origin", "main"]);
    git(seed, ["checkout", "-q", "-b", FEEDBACK_BRANCH]);
    git(seed, [
      "commit",
      "--allow-empty",
      "-m",
      `fix(feedback): x\n\nOrbit-Feedback: ${FEEDBACK_ID}`,
    ]);
    git(seed, ["push", "-q", "origin", FEEDBACK_BRANCH]);

    // Clone only the feedback branch: no local `main`, no origin/main yet.
    execFileSync("git", [
      "clone", "-q", "--single-branch", "--branch", FEEDBACK_BRANCH, origin, consumer,
    ]);
    // Bring in origin/main as a remote-tracking ref, still without a local main —
    // exactly what actions/checkout leaves behind for the sync workflow.
    git(consumer, ["remote", "set-branches", "--add", "origin", "main"]);
    git(consumer, ["fetch", "-q", "origin", "main"]);
  });

  afterAll(() => {
    process.chdir(originalCwd);
    rmSync(root, { recursive: true, force: true });
  });

  it("has origin/main but no local main (sanity)", () => {
    expect(git(consumer, ["branch", "--list", "main"])).toBe("");
    expect(git(consumer, ["rev-parse", "--verify", "--quiet", "origin/main^{commit}"]))
      .not.toBe("");
  });

  it("resolves the base to origin/<base>", () => {
    process.chdir(consumer);
    expect(resolveBaseRef("main")).toBe("origin/main");
  });

  it("finds the feedback commit without a local base branch", () => {
    process.chdir(consumer);
    const commits = listFeedbackCommits("main");
    expect(commits.map((c) => c.feedbackId)).toContain(FEEDBACK_ID);
  });
});

import { describe, it, expect } from "vitest";
import { liveFeedback, type FeedbackCommit } from "../git";

function commit(overrides: Partial<FeedbackCommit>): FeedbackCommit {
  return {
    sha: "0".repeat(40),
    shortSha: "0000000",
    subject: "fix(feedback): x",
    notes: [],
    ...overrides,
  };
}

describe("liveFeedback", () => {
  it("returns processing commits that have not been reverted", () => {
    const commits = [
      commit({ sha: "a", shortSha: "a", feedbackId: "id-1" }),
      commit({ sha: "b", shortSha: "b", feedbackId: "id-2" }),
    ];
    const live = liveFeedback(commits);
    expect([...live.keys()].sort()).toEqual(["id-1", "id-2"]);
    expect(live.get("id-1")?.sha).toBe("a");
  });

  it("drops an id once a revert commit exists for it", () => {
    const commits = [
      commit({ sha: "r", shortSha: "r", revertId: "id-1" }),
      commit({ sha: "a", shortSha: "a", feedbackId: "id-1" }),
    ];
    const live = liveFeedback(commits);
    expect(live.has("id-1")).toBe(false);
  });

  it("keeps the newest processing commit per id", () => {
    const commits = [
      commit({ sha: "new", shortSha: "new", feedbackId: "id-1" }),
      commit({ sha: "old", shortSha: "old", feedbackId: "id-1" }),
    ];
    const live = liveFeedback(commits);
    expect(live.get("id-1")?.sha).toBe("new");
  });
});

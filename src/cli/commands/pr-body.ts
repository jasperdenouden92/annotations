import {
  DEFAULT_MANIFEST,
  DEFAULT_RESULTS,
  readManifest,
  readResults,
} from "../manifest";
import { listFeedbackCommits, liveFeedback } from "../git";
import {
  renderPrBody,
  type ProcessedEntry,
  type NotProcessedEntry,
} from "../pr-body";
import { type Args, flagStr } from "../util";

export function prBodyCommand(args: Args): void {
  const manifest = readManifest(flagStr(args, "manifest", DEFAULT_MANIFEST));
  const results = readResults(flagStr(args, "results", DEFAULT_RESULTS));
  const base = flagStr(args, "base", manifest.base || "main");

  const live = liveFeedback(listFeedbackCommits(base));

  const processed: ProcessedEntry[] = [];
  const notProcessed: NotProcessedEntry[] = [];

  for (const item of manifest.items) {
    const commit = live.get(item.id);
    if (commit) {
      processed.push({ item, shortSha: commit.shortSha });
    } else {
      const reason =
        results[item.id]?.reason ?? "Niet automatisch verwerkt.";
      notProcessed.push({ item, reason });
    }
  }

  const date = (manifest.generatedAt || new Date().toISOString()).slice(0, 10);

  process.stdout.write(
    renderPrBody({ project: manifest.project, date, base, processed, notProcessed })
  );
}

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import type { FeedbackItem } from "../types";

export const DEFAULT_MANIFEST = ".orbit/feedback.json";
export const DEFAULT_RESULTS = ".orbit/results.json";

export interface Manifest {
  project: string;
  base: string;
  generatedAt: string;
  items: FeedbackItem[];
}

/** Per-item outcome the AI records for points it could not process. */
export interface ItemResult {
  skipped?: boolean;
  reason?: string;
}

export type ResultsFile = Record<string, ItemResult>;

export function writeJson(path: string, data: unknown): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(data, null, 2) + "\n", "utf8");
}

export function readManifest(path: string): Manifest {
  return JSON.parse(readFileSync(path, "utf8")) as Manifest;
}

export function readResults(path: string): ResultsFile {
  try {
    return JSON.parse(readFileSync(path, "utf8")) as ResultsFile;
  } catch {
    return {};
  }
}

import type { FeedbackItem } from "./types";

export interface ProcessedEntry {
  item: FeedbackItem;
  shortSha: string;
}

export interface NotProcessedEntry {
  item: FeedbackItem;
  reason: string;
}

export interface RenderInput {
  project: string;
  date: string;
  base: string;
  processed: ProcessedEntry[];
  notProcessed: NotProcessedEntry[];
}

const NOTION_ID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}|[0-9a-f]{32}/;
const CHECKLIST_LINE_RE = new RegExp(
  `^- \\[( |x)\\] \`(${NOTION_ID_RE.source})\``,
  "i"
);

function truncate(text: string, max = 120): string {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length > max ? clean.slice(0, max - 1) + "…" : clean;
}

function meta(item: FeedbackItem): string {
  return [item.pagina, item.component]
    .filter(Boolean)
    .map((s) => `\`${s}\``)
    .join(" · ");
}

/** Renders the PR body with a machine-parseable checklist. */
export function renderPrBody(input: RenderInput): string {
  const { project, date, base, processed, notProcessed } = input;
  const lines: string[] = [];

  lines.push(`## Feedback ${date} · ${project}`);
  lines.push("");
  lines.push(
    'Vink een punt **uit** om het terug te draaien: de commit wordt automatisch ' +
      'gerevert en het punt krijgt in Notion de status "Afgewezen". Bij merge gaan ' +
      'aangevinkte punten naar "Opgelost".'
  );
  lines.push("");

  lines.push("### Verwerkt");
  if (processed.length === 0) {
    lines.push("");
    lines.push("_Geen punten automatisch verwerkt._");
  } else {
    for (const { item, shortSha } of processed) {
      const suffix = [meta(item), shortSha].filter(Boolean).join(" · ");
      lines.push(
        `- [x] \`${item.id}\` **${item.auteur}** — "${truncate(item.comment)}"` +
          (suffix ? ` · ${suffix}` : "")
      );
    }
  }
  lines.push("");

  lines.push("### Niet verwerkt");
  if (notProcessed.length === 0) {
    lines.push("");
    lines.push("_Alles verwerkt._");
  } else {
    for (const { item, reason } of notProcessed) {
      lines.push(
        `- \`${item.id}\` **${item.auteur}** — "${truncate(item.comment)}" — ${reason}`
      );
    }
  }
  lines.push("");

  lines.push(`<!-- orbit-feedback v1 project=${project} base=${base} -->`);
  lines.push("");

  return lines.join("\n");
}

export interface ChecklistEntry {
  id: string;
  checked: boolean;
}

/** Parses the checklist lines from a PR body. Non-matching lines are ignored. */
export function parsePrBody(body: string): ChecklistEntry[] {
  const entries: ChecklistEntry[] = [];
  for (const line of body.split("\n")) {
    const m = line.match(CHECKLIST_LINE_RE);
    if (m) {
      entries.push({ id: m[2], checked: m[1].toLowerCase() === "x" });
    }
  }
  return entries;
}

/** Extracts `project`/`base` from the trailing HTML comment, if present. */
export function parsePrMeta(body: string): { project?: string; base?: string } {
  const m = body.match(/<!-- orbit-feedback v1 project=(\S+) base=(\S+) -->/);
  return m ? { project: m[1], base: m[2] } : {};
}

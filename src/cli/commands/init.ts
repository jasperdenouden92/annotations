import {
  existsSync,
  readFileSync,
  writeFileSync,
  copyFileSync,
  mkdirSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { getDatabase, PROPS, STATUSES } from "../notion";
import { type Args, flagBool } from "../util";

const HERE = dirname(fileURLToPath(import.meta.url));
// dist/cli.js → ../templates
const TEMPLATES = join(HERE, "..", "templates");

const COPIES: Array<{ from: string; to: string }> = [
  { from: "skill/SKILL.md", to: ".claude/skills/orbit-feedback/SKILL.md" },
  { from: "workflows/orbit-feedback.yml", to: ".github/workflows/orbit-feedback.yml" },
  {
    from: "workflows/orbit-feedback-sync.yml",
    to: ".github/workflows/orbit-feedback-sync.yml",
  },
];

export async function initCommand(args: Args): Promise<void> {
  if (flagBool(args, "check")) {
    await checkSchema();
    return;
  }

  for (const { from, to } of COPIES) {
    const src = join(TEMPLATES, from);
    const existed = existsSync(to);
    mkdirSync(dirname(to), { recursive: true });
    copyFileSync(src, to);
    process.stdout.write(`${existed ? "Bijgewerkt" : "Aangemaakt"}: ${to}\n`);
  }

  addGitignore(".orbit/");

  process.stdout.write(
    "\nKlaar. Volgende stappen:\n" +
      "  1. Zet de secrets NOTION_API_KEY, NOTION_DATABASE_ID, NOTION_PROJECT_ID\n" +
      "     en CLAUDE_CODE_OAUTH_TOKEN in GitHub.\n" +
      "  2. Controleer het Notion-schema: npx orbit-feedback init --check\n"
  );
}

function addGitignore(entry: string): void {
  const path = ".gitignore";
  let content = "";
  if (existsSync(path)) content = readFileSync(path, "utf8");
  if (content.split("\n").some((l) => l.trim() === entry.trim())) return;
  const prefix = content && !content.endsWith("\n") ? "\n" : "";
  writeFileSync(path, content + prefix + entry + "\n", "utf8");
  process.stdout.write(`Toegevoegd aan .gitignore: ${entry}\n`);
}

async function checkSchema(): Promise<void> {
  const db = await getDatabase();
  const props = db.properties ?? {};
  const problems: string[] = [];

  const required: Array<{ name: string; type: string }> = [
    { name: PROPS.project, type: "relation" },
    { name: PROPS.annotationId, type: "rich_text" },
    { name: PROPS.comment, type: "rich_text" },
    { name: PROPS.auteur, type: "rich_text" },
    { name: PROPS.status, type: "select" },
    { name: PROPS.pagina, type: "rich_text" },
    { name: PROPS.label, type: "rich_text" },
    { name: PROPS.component, type: "rich_text" },
    { name: PROPS.bron, type: "rich_text" },
    { name: PROPS.antwoord, type: "rich_text" },
    { name: PROPS.pr, type: "url" },
  ];

  for (const { name, type } of required) {
    const prop = props[name];
    if (!prop) {
      problems.push(`Ontbrekende property: "${name}" (type ${type}).`);
    } else if (prop.type !== type) {
      problems.push(`Property "${name}" heeft type ${prop.type}, verwacht ${type}.`);
    }
  }

  const statusProp = props[PROPS.status];
  if (statusProp?.type === "select") {
    const options = new Set(
      (statusProp.select?.options ?? []).map((o: { name: string }) => o.name)
    );
    for (const s of STATUSES) {
      if (!options.has(s)) problems.push(`Ontbrekende Status-optie: "${s}".`);
    }
  }

  if (problems.length === 0) {
    process.stdout.write("Notion-schema is in orde.\n");
    return;
  }

  process.stdout.write("Notion-schema is niet compleet:\n");
  for (const p of problems) process.stdout.write(`  - ${p}\n`);
  process.exit(1);
}

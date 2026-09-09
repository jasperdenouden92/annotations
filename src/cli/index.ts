import { parseArgs, fail } from "./util";
import { fetchCommand } from "./commands/fetch";
import { statusCommand } from "./commands/status";
import { prBodyCommand } from "./commands/pr-body";
import { syncCommand } from "./commands/sync";
import { initCommand } from "./commands/init";

const HELP = `orbit-feedback — verwerk Orbit-klantfeedback tot een reviewbare PR

Gebruik:
  orbit-feedback <command> [opties]

Commands:
  fetch      Haal open feedback uit Notion en schrijf een manifest.
             --project <naam>   (of ORBIT_PROJECT)
             --status <lijst>   komma-gescheiden, standaard "Open"
             --claim            zet opgehaalde punten op "In behandeling"
             --out <pad>        standaard .orbit/feedback.json
             --base <branch>    standaard main

  status     Werk de status van feedbackpunten bij in Notion.
             --set <Status>     verplicht
             --pr <url>         zet ook de PR-link
             --antwoord <tekst> zet ook een antwoord
             --from-manifest    gebruik ids uit het manifest
             --from-results     gebruik niet-verwerkte ids uit .orbit/results.json
             --stale <uren>     geef verlopen "In behandeling"-claims vrij
             <id...>            expliciete Notion-page-ids

  pr-body    Genereer de PR-body (checklist) uit manifest + git-trailers.
             --manifest <pad>   standaard .orbit/feedback.json
             --results <pad>    standaard .orbit/results.json
             --base <branch>

  sync       Verwerk aan-/uitvinken in de PR: revert + statusupdate.
             --pr <nummer>      haalt body/merge-status via gh op
             --body-file <pad>  lees de body uit een bestand
             --merged           behandel als gemergede PR

  init       Kopieer skill + workflows naar dit project.
             --check            valideer alleen het Notion-schema

Environment:
  NOTION_API_KEY, NOTION_DATABASE_ID, ORBIT_PROJECT
`;

async function main(): Promise<void> {
  const [, , command, ...rest] = process.argv;
  const args = parseArgs(rest);

  switch (command) {
    case "fetch":
      return fetchCommand(args);
    case "status":
      return statusCommand(args);
    case "pr-body":
      return prBodyCommand(args);
    case "sync":
      return syncCommand(args);
    case "init":
      return initCommand(args);
    case undefined:
    case "help":
    case "--help":
    case "-h":
      process.stdout.write(HELP);
      return;
    default:
      fail(`Onbekend command: ${command}. Zie 'orbit-feedback --help'.`);
  }
}

main().catch((err: unknown) => {
  fail(err instanceof Error ? err.message : String(err));
});

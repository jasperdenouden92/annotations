---
name: orbit-feedback
description: Verwerk open Orbit-feedback uit Notion in een feedback/-branch met één commit per punt en open een PR met checklist.
---

# Orbit feedback verwerken

Verwerk open klantfeedback (verzameld met Orbit) tot één reviewbare pull request.
Elk feedbackpunt wordt een eigen commit, zodat een reviewer per punt kan beslissen
om het te houden of terug te draaien.

De `orbit-feedback` CLI (uit `@jasperdenouden92/annotations`) doet het praten met
Notion en git; jij doet alleen de codewijzigingen (stap 3). Env-variabelen
`NOTION_API_KEY`, `NOTION_DATABASE_ID` en `ORBIT_PROJECT` (of `--project`) moeten
gezet zijn.

## Stappen

1. **Preflight.** Controleer dat de working tree schoon is en dat je op de default
   branch (`main`) staat. Haal de open feedback op:

   ```bash
   npx orbit-feedback fetch --project "$ORBIT_PROJECT" --claim
   ```

   Dit schrijft `.orbit/feedback.json` en zet de punten op "In behandeling". Zijn er
   geen open punten? Meld dat (in het Nederlands) en stop.

2. **Branch.** Maak een branch `feedback/YYYY-MM-DD` (voeg `-HHMM` toe als die al
   bestaat).

   ```bash
   git checkout -b "feedback/$(date +%F)"
   ```

3. **Verwerk elk punt** uit `.orbit/feedback.json`, in volgorde. Per punt:

   - **Lokaliseer de code.** Gebruik in deze volgorde: `bron` (`bestand:regel`),
     dan `component` (componentnaam), dan `label`/`pagina`/`annotationId`
     (CSS-pad) met grep. Zeg per punt hoe zeker de koppeling is.
   - **Ben je zeker en is het een codewijziging?** Maak de kleinst mogelijke
     wijziging die de feedback adresseert. Draai typecheck/lint als die scripts
     bestaan. Commit het punt precies één keer, met de trailer:

     ```
     fix(feedback): <korte Engelse samenvatting>

     <auteur>: "<comment>"

     Orbit-Feedback: <notion-page-id>
     ```

   - **Twijfel je, of is het geen codewijziging** (compliment, vraag,
     contentbeslissing)? Doe niets en noteer het in `.orbit/results.json`:

     ```json
     { "<notion-page-id>": { "skipped": true, "reason": "<reden in het Nederlands>" } }
     ```

4. **Open de PR.**

   ```bash
   npx orbit-feedback pr-body > .orbit/pr-body.md
   git push -u origin HEAD
   gh pr create --title "Feedback $(date +%F)" --body-file .orbit/pr-body.md --label orbit-feedback
   ```

5. **Werk Notion bij.**

   ```bash
   PR_URL=$(gh pr view --json url -q .url)
   npx orbit-feedback status --from-manifest --set "In review" --pr "$PR_URL"
   npx orbit-feedback status --from-results --set Open
   ```

## Harde regels

- **Eén punt = één commit.** Nooit twee punten in één commit, nooit amend of squash.
- **De trailer `Orbit-Feedback: <id>` is verplicht** op elke verwerk-commit — zonder
  trailer valt het punt buiten de checklist.
- **Geen refactors, geen dependency-wijzigingen, geen formatting-only diffs.** Raak
  alleen aan wat het feedbackpunt vraagt. Kom niet aan `package.json` of lockfiles.
- **Taal:** code en commits in het Engels; alles wat de klant leest (Antwoord,
  PR-body) in het Nederlands.
- Kun je een punt niet met zekerheid koppelen? Sla het over met een reden — forceer
  geen gok.

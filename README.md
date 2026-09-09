# @jasperdenouden92/annotations

Centrale annotation engine. Eén package, meerdere projecten.

## Installatie

```bash
npm install @jasperdenouden92/annotations
```

Zorg dat je `.npmrc` verwijst naar GitHub Packages:
```
@jasperdenouden92:registry=https://npm.pkg.github.com
```

---

## Gebruik

### 1. Provider + Button + Panel in je root layout

```tsx
import {
  AnnotationProvider,
  AnnotationButton,
  AnnotationPanel,
} from "@jasperdenouden92/annotations";
import { useLocation } from "react-router-dom";
import { annotations } from "@/annotations/data";

export default function RootLayout() {
  const { pathname } = useLocation();

  return (
    <AnnotationProvider annotations={annotations} currentRoute={pathname}>
      {/* je app content */}
      <Outlet />

      <AnnotationButton />
      <AnnotationPanel />
    </AnnotationProvider>
  );
}
```

### 2. Annotations data in je project

```ts
// src/annotations/data.ts
import type { Annotation } from "@jasperdenouden92/annotations";

export const annotations: Annotation[] = [
  {
    id: "1",
    target: "dashboard",
    title: "Welkom op het dashboard",
    body: "Hier vind je een overzicht van alle relevante data.",
    author: "Elwin",
    date: "2026-03-30",
    type: "info",
  },
  {
    id: "2",
    target: "dashboard/orders",
    elementId: "order-table",
    title: "Nieuwe kolom: status",
    body: "We hebben een statuskolom toegevoegd zodat je direct ziet waar elke order staat.",
    author: "Jasper",
    date: "2026-03-31",
    type: "new",
  },
];
```

### 3. AnnotationMarker op elementen

```tsx
import { AnnotationMarker } from "@jasperdenouden92/annotations";

function OrderTable() {
  return (
    <AnnotationMarker annotationId="2" position="top-right">
      <table>{/* ... */}</table>
    </AnnotationMarker>
  );
}
```

### 4. Context stack voor dialogs/panels

```tsx
import { useAnnotations } from "@jasperdenouden92/annotations";

function ConversationDialog() {
  const { pushContext, popContext } = useAnnotations();

  useEffect(() => {
    pushContext("dialog:conversation");
    return () => popContext();
  }, [pushContext, popContext]);

  return <div>{/* dialog content */}</div>;
}
```

---

## Annotation types

| Type            | Kleur   | Gebruik                          |
|-----------------|---------|----------------------------------|
| `documentation` | Grijs   | Uitleg en documentatie           |
| `pro`           | Groen   | Positief punt, wat goed werkt    |
| `question`      | Blauw   | Open vraag of onduidelijkheid    |
| `con`           | Rood    | Negatief punt, probleem          |
| `suggestion`    | Paars   | Voorstel of verbetering          |
| `critical`      | Oranje  | Urgent, moet opgelost worden     |
| `user-insight`  | Roze    | Inzicht uit user testing/feedback|

---

## Configuratie

### Settings

```tsx
<AnnotationProvider
  annotations={data}
  currentRoute={pathname}
  settings={{
    togglePosition: "bottom-right",  // positie van de button
    defaultVisible: false,           // start met annotaties aan/uit
    accentColor: "#1567a4",          // accent kleur
    panelWidth: 420,                 // panel breedte in px
    panelHeight: 640,                // panel hoogte in px
    zIndex: 9000,                    // basis z-index
    keyboardShortcut: true,          // Cmd+. / Ctrl+. toggle
  }}
>
```

### Labels (i18n)

```tsx
<AnnotationProvider
  annotations={data}
  currentRoute={pathname}
  labels={{
    toggleShow: "Show annotations",
    toggleHide: "Hide annotations",
    tabCurrentPage: "This page",
    tabAll: "All",
    searchPlaceholder: "Search annotations...",
    panelTitle: "Annotations",
    noResults: "No results",
  }}
>
```

---

## Route matching

Annotations worden gefilterd op basis van `target` vs `currentRoute`:

- **Exact match**: `"dashboard/orders"` matcht `/dashboard/orders`
- **Wildcards**: `"projects/:id/details"` matcht `/projects/123/details`
- **Global**: `"global"` matcht altijd, op elke pagina
- **Context**: `"dialog:conversation"` matcht wanneer `pushContext("dialog:conversation")` actief is

---

## Feedback verwerken met AI

Klanten schieten feedback in via de Inspector (het kruisje-icoon rechtsonder):
ze klikken een element aan en typen een opmerking. Die opmerkingen komen in
Notion. Einde van de dag — of wanneer je zelf `/orbit-feedback` draait — opent
AI een branch in het **klantproject**, verwerkt elk punt als een eigen commit, en
opent een pull request met een checklist. Jij reviewt per punt, vinkt uit wat niet
goed was, en merget.

### In het kort

1. Klant plaatst feedback → Notion (status `Open`).
2. Run (dagelijks of op commando) → branch `feedback/YYYY-MM-DD`, één commit per
   punt, PR met checklist. Punten gaan naar `In review`.
3. Jij reviewt. Vink een punt **uit** → de commit wordt teruggedraaid, punt gaat
   naar `Afgewezen`.
4. Merge → aangevinkte punten gaan naar `Opgelost`.

### Notion-schema

De feedback-database heeft deze properties nodig (Nederlandse namen, exact):

| Property | Type | Inhoud |
|----------|------|--------|
| `Project` | Relation | koppeling naar de Projects-database |
| `Annotatie ID` | Text | CSS-pad van het element |
| `Comment` | Text | de opmerking |
| `Auteur` | Text | naam van de klant |
| `Status` | Select | zie hieronder |
| `Pagina` | Text | pad van de pagina |
| `Label` | Text | tag + tekst van het element |
| `Component` | Text | React-componentnaam (dev/staging) |
| `Bron` | Text | `bestand:regel` (dev/staging) |
| `Antwoord` | Text | reactie richting de klant |
| `PR` | URL | link naar de feedback-PR |

`Status`-opties: `Open`, `In behandeling`, `In review`, `Opgelost`, `Afgewezen`.

Controleer het schema met:

```bash
npx orbit-feedback init --check
```

### Opzetten in een klantproject

```bash
npx orbit-feedback init
```

Dit kopieert de skill en twee GitHub-workflows naar het project. Zet daarna:

- **Secrets** (GitHub → Settings → Secrets): `NOTION_API_KEY`,
  `NOTION_DATABASE_ID`, `CLAUDE_CODE_OAUTH_TOKEN` (genereer met
  `claude setup-token`). Optioneel `ORBIT_GH_TOKEN` (een PAT) als je wilt dat CI
  ook op de feedback-PR draait — pushes met de standaard `GITHUB_TOKEN` triggeren
  geen checks.
- **Variabele**: `ORBIT_PROJECT` — de **Notion page-id** van het project in je
  Projects-database (niet de naam). Omdat `Project` een relatie is, filtert en
  schrijft de tooling op die page-id. Dezelfde waarde geef je mee aan de widget
  (`comments.project` in de `AnnotationProvider`).

De dagelijkse run staat op werkdagen 18:00 (Amsterdam, zomertijd). Start hem
handmatig via de Actions-tab (workflow "Orbit feedback" → Run workflow).

### Component + bronbestand meesturen

In dev- en staging-builds kan Orbit de componentnaam en het bronbestand van het
aangeklikte element meesturen, zodat de AI de code veel preciezer terugvindt. Voeg
de Babel-plugin toe aan je Vite-config, alleen buiten productie:

```ts
// vite.config.ts
import { orbitSource } from "@jasperdenouden92/annotations/babel";

export default defineConfig(({ mode }) => ({
  plugins: [
    react({ babel: { plugins: mode !== "production" ? [orbitSource()] : [] } }),
  ],
}));
```

Let op: een staging-deploy is meestal ook `vite build` (mode `production`). Bouw
staging daarom met een aparte mode zodat de plugin draait:

```bash
vite build --mode staging
```

Zonder de plugin blijft alles werken; de AI valt dan terug op de (mogelijk
geminificeerde) componentnaam via de React-fiber en het CSS-pad.

### Lokaal draaien

In plaats van te wachten op de dagelijkse run:

```bash
# in het klantproject, met NOTION_API_KEY, NOTION_DATABASE_ID, ORBIT_PROJECT gezet
/orbit-feedback
```

De skill haalt de feedback op, maakt de branch, laat de AI de punten verwerken en
opent de PR. Een punt handmatig afwijzen buiten de PR om:

```bash
npx orbit-feedback sync --pr 42 && git push
```

### CLI-overzicht

| Command | Doet |
|---------|------|
| `orbit-feedback fetch` | Haalt open feedback op → `.orbit/feedback.json` (`--claim` zet op In behandeling) |
| `orbit-feedback status` | Werkt de Notion-status bij (`--set`, `--pr`, `--antwoord`, `--stale <uren>`) |
| `orbit-feedback pr-body` | Genereert de PR-checklist uit manifest + git-trailers |
| `orbit-feedback sync` | Verwerkt aan-/uitvinken: revert + statusupdate |
| `orbit-feedback init` | Kopieert skill + workflows (`--check` valideert het schema) |

---

## Een update deployen

```bash
# In dit package:
npm version patch   # bug fix
npm version minor   # nieuwe feature
npm version major   # breaking change
npm publish

# In elk project:
npm update @jasperdenouden92/annotations
```

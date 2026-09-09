# Orbit

`@strakzat/orbit` — central annotation & feedback engine. One package, many projects.

## Installation

```bash
npm install @strakzat/orbit
```

Make sure your `.npmrc` points to GitHub Packages:
```
@jasperdenouden92:registry=https://npm.pkg.github.com
```

---

## Quick start

The fastest way to get started is the CLI:

```bash
npx orbit-init
```

This automates the full setup:

1. Creates `src/annotations/data.js` with an empty annotations array
2. Finds your root layout file (the one that uses `useLocation()`, e.g. `App.tsx`)
3. Adds the required imports
4. Wraps your layout in `<AnnotationProvider>` and adds `<AnnotationButton />` and `<AnnotationPanel />`

The command is idempotent: if everything is already configured, nothing changes.

---

## Manual setup

### 1. Provider + Button + Panel in your root layout

```tsx
import {
  AnnotationProvider,
  AnnotationButton,
  AnnotationPanel,
} from "@strakzat/orbit";
import { useLocation } from "react-router-dom";
import { annotations } from "@/annotations/data";

export default function RootLayout() {
  const { pathname } = useLocation();

  return (
    <AnnotationProvider annotations={annotations} currentRoute={pathname}>
      {/* your app content */}
      <Outlet />

      <AnnotationButton />
      <AnnotationPanel />
    </AnnotationProvider>
  );
}
```

### 2. Annotations data in your project

```ts
// src/annotations/data.ts
import type { Annotation } from "@strakzat/orbit";

export const annotations: Annotation[] = [
  {
    id: "1",
    target: "dashboard",
    title: "Welcome to the dashboard",
    body: "Here you'll find an overview of all the relevant data.",
    author: "Elwin",
    date: "2026-03-30",
    type: "info",
  },
  {
    id: "2",
    target: "dashboard/orders",
    elementId: "order-table",
    title: "New column: status",
    body: "We added a status column so you can see at a glance where each order stands.",
    author: "Jasper",
    date: "2026-03-31",
    type: "new",
  },
];
```

### 3. AnnotationMarker on elements

```tsx
import { AnnotationMarker } from "@strakzat/orbit";

function OrderTable() {
  return (
    <AnnotationMarker annotationId="2" position="top-right">
      <table>{/* ... */}</table>
    </AnnotationMarker>
  );
}
```

### 4. Context stack for dialogs/panels

```tsx
import { useAnnotations } from "@strakzat/orbit";

function ConversationDialog() {
  const { pushContext, popContext } = useAnnotations();

  useEffect(() => {
    pushContext("dialog:conversation");
    return () => popContext();
  }, [pushContext, popContext]);

  return <div>{/* dialog content */}</div>;
}
```

### 5. Add annotation IDs automatically

Run the scanner to find UI elements and add `data-annotation-id` attributes automatically:

```bash
npx orbit-scan
```

This scans your `src/` folder for navigation, tables, forms, cards, modals, etc. and offers to add stable IDs. The feedback inspector recognises these IDs automatically when users leave comments.

> **Tip:** after `orbit-init`, `orbit-scan` is the logical next step to label your UI elements.

### 6. Server helpers for the comments API

The package exports server-side helpers for your Notion comments API:

```ts
import {
  buildNotionCommentProperties,
  parseNotionComment,
} from "@strakzat/orbit/server";
```

**POST handler**: builds all the Notion properties (including the `pagina` field):

```ts
const { annotationId, auteur, comment, pagina, label } = req.body;
const properties = buildNotionCommentProperties(
  { annotationId, auteur, comment, pagina, label },
  NOTION_PROJECT_ID
);

await fetch(`https://api.notion.com/v1/pages`, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${NOTION_API_KEY}`,
    "Notion-Version": "2022-06-28",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    parent: { database_id: NOTION_DATABASE_ID },
    properties,
  }),
});
```

**GET handler**: parses Notion pages into Comment objects:

```ts
const data = await response.json();
const comments = data.results.map(parseNotionComment);
```

---

## Annotation types

| Type            | Colour  | Use                               |
|-----------------|---------|-----------------------------------|
| `documentation` | Grey    | Explanation and documentation     |
| `pro`           | Green   | A positive point, what works well |
| `question`      | Blue    | An open question or unclear point |
| `con`           | Red     | A negative point, a problem       |
| `suggestion`    | Purple  | A proposal or improvement         |
| `critical`      | Orange  | Urgent, needs fixing              |
| `user-insight`  | Pink    | An insight from user testing/feedback |

---

## Configuration

### Settings

```tsx
<AnnotationProvider
  annotations={data}
  currentRoute={pathname}
  settings={{
    togglePosition: "bottom-right",  // button position
    defaultVisible: false,           // start with annotations on/off
    accentColor: "#1567a4",          // accent colour
    panelWidth: 420,                 // panel width in px
    panelHeight: 640,                // panel height in px
    zIndex: 9000,                    // base z-index
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

Annotations are filtered by `target` against `currentRoute`:

- **Exact match**: `"dashboard/orders"` matches `/dashboard/orders`
- **Wildcards**: `"projects/:id/details"` matches `/projects/123/details`
- **Global**: `"global"` always matches, on every page
- **Context**: `"dialog:conversation"` matches when `pushContext("dialog:conversation")` is active

---

## Feedback → PR automation

Feedback that clients leave with the Inspector lands in Notion. Once a day, or on
demand, AI opens a branch in the **client project**, addresses each open feedback
point as its own commit, and opens a PR with a **checklist**. Reviewers uncheck a
point to reject it: its commit is reverted and the point goes to `Afgewezen` in
Notion. On merge, checked points go to `Opgelost`.

This builds on the same Notion schema the comments API already uses (`Project` as
a relation, `Status` as a select). It adds two statuses — `In review` and
`Afgewezen` — and three fields the automation writes or reads: `Component`, `Bron`
and `PR` (a URL). Validate the schema with:

```bash
npx orbit-feedback init --check
```

### Set up in a client project

```bash
npx orbit-feedback init
```

This copies a Claude Code skill and two GitHub workflows into the project. Then set:

- **Secrets**: `NOTION_API_KEY`, `NOTION_DATABASE_ID`, `NOTION_PROJECT_ID` (the
  project's Notion page id — the same relation target the comments API uses), and
  `CLAUDE_CODE_OAUTH_TOKEN` (from `claude setup-token`). Optional `ORBIT_GH_TOKEN`
  (a PAT) if you want CI to run on the feedback PR.
- **Package access**: `npm ci` installs `@strakzat/orbit` from GitHub Packages.
  The workflow's `GITHUB_TOKEN` can read it only if this repo has access to the
  package — set the package to **Internal** visibility, or add the repo under the
  package's **Manage Actions access**. If neither is possible (e.g. a different
  org), set `ORBIT_NPM_TOKEN` to a PAT with `read:packages`; the workflows prefer
  it over `GITHUB_TOKEN`.

The `orbit-feedback` label is created automatically on the first run, so you don't
need to add it by hand.

The scheduled run fires on weekdays at 18:00 Amsterdam time; start it by hand from
the Actions tab ("Orbit feedback" → Run workflow).

### Run it locally

```bash
# with NOTION_API_KEY, NOTION_DATABASE_ID and NOTION_PROJECT_ID set
/orbit-feedback
```

Reject a point outside the PR flow:

```bash
npx orbit-feedback sync --pr 42 && git push
```

### CLI

| Command | Does |
|---------|------|
| `orbit-feedback fetch` | Pulls open feedback → `.orbit/feedback.json` (`--claim` sets In behandeling) |
| `orbit-feedback status` | Updates Notion status (`--set`, `--pr`, `--antwoord`, `--stale <hours>`) |
| `orbit-feedback pr-body` | Builds the PR checklist from the manifest + git trailers |
| `orbit-feedback sync` | Handles check/uncheck: revert + status update |
| `orbit-feedback init` | Copies skill + workflows (`--check` validates the schema) |

Points are tied to commits by the trailer `Orbit-Feedback: <notion-page-id>`.

> **Source capture** (sending the React component name and source file with a
> comment, so the AI maps feedback to code more precisely) is not part of this
> version; the AI falls back to the label, page and element path. It is a planned
> follow-up.

---

## Deploying an update

```bash
# In this package:
npm version patch   # bug fix
npm version minor   # new feature
npm version major   # breaking change
npm publish

# In each project:
npm update @strakzat/orbit
```

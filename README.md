# @jasperdenouden92/annotations

Central annotation engine. One package, many projects.

## Installation

```bash
npm install @jasperdenouden92/annotations
```

Make sure your `.npmrc` points to GitHub Packages:
```
@jasperdenouden92:registry=https://npm.pkg.github.com
```

---

## Quick start

The fastest way to get started is the CLI:

```bash
npx annotate-init
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
} from "@jasperdenouden92/annotations";
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
import type { Annotation } from "@jasperdenouden92/annotations";

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
import { AnnotationMarker } from "@jasperdenouden92/annotations";

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

### 5. Add annotation IDs automatically

Run the scanner to find UI elements and add `data-annotation-id` attributes automatically:

```bash
npx annotate-scan
```

This scans your `src/` folder for navigation, tables, forms, cards, modals, etc. and offers to add stable IDs. The feedback inspector recognises these IDs automatically when users leave comments.

> **Tip:** after `annotate-init`, `annotate-scan` is the logical next step to label your UI elements.

### 6. Server helpers for the comments API

The package exports server-side helpers for your Notion comments API:

```ts
import {
  buildNotionCommentProperties,
  parseNotionComment,
} from "@jasperdenouden92/annotations/server";
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

## Deploying an update

```bash
# In this package:
npm version patch   # bug fix
npm version minor   # new feature
npm version major   # breaking change
npm publish

# In each project:
npm update @jasperdenouden92/annotations
```

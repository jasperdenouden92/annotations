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

# @jasperdenouden92/annotations

Client-facing annotation & feedback engine voor alle projecten. React-based, zero runtime dependencies buiten React.

## Quick start (consuming project)

```tsx
import { AnnotationProvider, AnnotationButton, AnnotationPanel, AnnotationMarker } from "@jasperdenouden92/annotations";

<AnnotationProvider
  annotations={annotations}
  currentRoute={window.location.pathname}
  comments={{ enabled: true, apiBase: "", project: "my-project" }}
>
  <AnnotationButton />
  <AnnotationPanel />
  {/* Wrap specifieke elementen: */}
  <AnnotationMarker annotationId="my-annotation-id">
    <MyComponent />
  </AnnotationMarker>
</AnnotationProvider>
```

## Architecture

### Core data flow

```
AnnotationProvider (context + state)
├── AnnotationButton        — toggle button met counter badge (annotations + open feedback)
├── AnnotationPanel         — side panel met twee tabs: Annotaties / Feedback
├── Inspector               — crosshair element picker voor feedback comments
├── FeedbackMarkers         — floating badges op elementen met comments (niet gewrapt in AnnotationMarker)
├── AutoAnnotationMarkers   — floating badges op auto-discovered elementen met data-annotation-id
└── AnnotationMarker        — wrapper component voor specifieke elementen (inline badge + popover)
```

### Key types

```typescript
interface Annotation {
  id: string;              // Uniek ID, matcht met data-annotation-id in DOM
  target: string;          // Route pattern ("/", "/settings", "global") — supports :param wildcards
  elementId?: string;      // Optioneel: DOM element id of data-annotation-id om te highlighten
  title: string;
  body: string;
  author: string;
  date: string;
  type?: AnnotationType;   // "documentation" | "pro" | "question" | "con" | "suggestion" | "critical" | "user-insight"
}

interface Comment {
  id: string;
  auteur: string;          // Auteur naam
  comment: string;         // Feedback tekst
  status: "Open" | "In behandeling" | "Opgelost";
  antwoord: string | null; // Admin reply
  aangemaakt: string;      // ISO date
  pagina?: string;         // Route waar feedback is geplaatst (window.location.pathname)
  label?: string;          // Element label ("<button> Submit...")
  annotationId?: string;   // Element reference (data-annotation-id, id, of CSS selector path)
}

interface CommentsConfig {
  enabled: boolean;
  apiBase: string;         // Leeg string = window.location.origin
  project: string;         // Project identifier voor API calls
}
```

### AnnotationProvider props

| Prop | Type | Default | Beschrijving |
|------|------|---------|-------------|
| `annotations` | `Annotation[]` | required | Alle annotaties voor het project |
| `currentRoute` | `string` | `"/"` | Huidige route — nodig voor page filtering |
| `settings` | `AnnotationSettings` | zie defaults | UI instellingen |
| `labels` | `Partial<AnnotationLabels>` | Nederlands | UI teksten (volledig overrideable) |
| `comments` | `CommentsConfig` | undefined | Feedback systeem config |

### Settings defaults

```typescript
{
  togglePosition: "bottom-right",
  defaultVisible: false,
  accentColor: "#344054",
  panelWidth: 420,
  panelHeight: 640,
  zIndex: 9000,
  keyboardShortcut: true,   // Cmd+. / Ctrl+.
}
```

## File structure

```
src/
├── index.ts                          — Public exports
├── types.ts                          — Alle TypeScript types
├── constants.ts                      — Defaults, kleuren, labels
├── icons.ts                          — Inline SVG icon components
├── context/
│   ├── AnnotationContext.tsx          — Provider: state management, keyboard shortcuts, route tracking
│   ├── useAnnotations.ts             — Hook (throws als buiten provider)
│   └── useAnnotationsSafe.ts         — Hook (geeft defaults terug als buiten provider)
├── components/
│   ├── AnnotationButton.tsx           — Floating toggle button met counter
│   ├── AnnotationPanel.tsx            — Side panel: annotation list + feedback list + filters + search
│   ├── AnnotationCard.tsx             — Annotation card in panel (title, body, type badge, page breadcrumb)
│   ├── AnnotationMarker.tsx           — Wrapper component: badge + outline + inline popover
│   ├── AutoAnnotationMarkers.tsx      — Auto-discovers data-annotation-id elementen, renders floating badges
│   ├── FeedbackMarkers.tsx            — Floating feedback badges op elementen met comments
│   ├── Inspector.tsx                  — Element picker: crosshair cursor, click-to-comment
│   ├── CommentThread.tsx              — Comment lijst met status badges en replies
│   └── CommentForm.tsx                — Feedback submit formulier (auteur + comment)
├── hooks/
│   ├── useComments.ts                 — Fetch + submit comments voor specifiek annotationId (polls 30s)
│   └── useAllComments.ts              — Fetch alle comments voor project (polls 30s)
└── utils/
    ├── drag.ts                        — Button/panel positioning + drag-to-corner logic
    ├── element-id.ts                  — getElementPath() CSS selector + getElementLabel() preview
    ├── find-element.ts                — findElementByAnnotationId() 3-tier lookup + highlight functions
    ├── popover-position.ts            — Smart popover positioning (fixed + absolute variants)
    └── route-matching.ts              — Route pattern matching met :param wildcards
```

## Inspector element snap logic

Wanneer een gebruiker een element klikt in inspector mode, wordt het element geidentificeerd via een 3-pass walk-up:

1. **data-annotation-id** — Loopt DOM tree op, zoekt eerste ancestor met `data-annotation-id` attribuut (voorgedefinieerde annotation markers). Skipt full-page containers (>90% viewport).
2. **id** — Als geen annotation_id gevonden, loopt opnieuw op zoekend naar `id` attribuut. Skipt full-page containers.
3. **CSS selector path** — Fallback: genereert pad als `#root > div > section:nth-of-type(2) > button`.

Het opgeslagen `annotationId` in een Comment wordt later opgezocht via `findElementByAnnotationId()`:
1. `document.getElementById(id)`
2. `document.querySelector('[data-annotation-id="..."]')`
3. `document.querySelector(cssPath)` — als het path `>` of `:nth-of-type` bevat

## API endpoints (verwacht door consuming project)

```
GET  {apiBase}/api/comments?project={project}                         → Comment[]
GET  {apiBase}/api/comments?project={project}&annotationId={id}       → Comment[]
POST {apiBase}/api/comments  body: { project, annotationId, auteur, comment, pagina, label }
```

Als `apiBase` leeg is, wordt `window.location.origin` gebruikt.

## Page filtering & counters

- **Annotations**: gefilterd op `matchRoute(annotation.target, currentRoute)` — supports `:param` wildcards
- **Feedback**: gefilterd op `comment.pagina === currentRoute || !comment.pagina`
- **Panel sub-tabs**: "Deze pagina" vs "Alles" — gedeelde tab tussen annotations en feedback views
- **AnnotationButton counter**: `currentAnnotations.length + openFeedbackCount` (page-gefilterd)
- **Feedback tab badge**: toont count van niet-opgeloste feedback op huidige pagina

## Build & publish

```bash
npm run build     # tsup → dist/ (ESM + CJS + DTS)
npm version patch # bump version
npm publish       # publishes to GitHub Packages (npm.pkg.github.com)
```

Output: `dist/index.js` (CJS), `dist/index.mjs` (ESM), `dist/index.d.ts` (types). Alle files krijgen `"use client";` banner voor Next.js compatibiliteit.

## Code patterns

- Alle components gebruiken `React.createElement()` — geen JSX. Dit is bewust: het package hoeft geen JSX transform en werkt in elke bundler.
- Geen externe dependencies buiten React peer dep.
- `useAnnotationsSafe()` geeft safe defaults wanneer buiten AnnotationProvider — voorkomt crashes bij optioneel gebruik.
- Panel corner positie wordt opgeslagen in localStorage (`@jasperdenouden92/annotations:panelCorner`).
- Comments worden gepolled elke 30 seconden wanneer annotation mode of inspector actief is.

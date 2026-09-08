# Orbit (`@strakzat/orbit`)

Client-facing annotation & feedback engine voor alle projecten. React-based, zero runtime dependencies buiten React.

## Quick start (consuming project)

```tsx
import { AnnotationProvider, AnnotationButton, AnnotationPanel, AnnotationMarker } from "@strakzat/orbit";

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
├── AnnotationPanel         — side panel; de tabs Annotaties / Feedback zijn de bovenste rij
├── Inspector               — crosshair element picker voor feedback comments (eigen toggle-knop)
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
  accentColor: "#171717",
  panelWidth: 420,
  panelHeight: 640,
  zIndex: 9000,
  keyboardShortcut: true,   // Cmd+. / Ctrl+.
}
```

## File structure

Bestands- en mapnamen zijn `kebab-case`, componentnamen `PascalCase` — `AnnotationPanel` woont in `annotation-panel.tsx`.

```
src/
├── index.ts                          — Public exports
├── types.ts                          — Alle TypeScript types
├── constants.ts                      — Defaults, labels, type-iconen (géén kleuren)
├── icons.ts                          — Inline SVG iconen via één createIcon() factory
├── vite.ts                           — Vite plugin: annotationsDevApi() voor local dev API
├── styles/
│   ├── tokens.ts                      — CSS-variabelen: light, dark, type- en statuskleuren
│   ├── rules.ts                       — Component-regels, reset eerst
│   ├── sheet.ts                       — Stelt de stylesheet samen
│   ├── inject.ts                      — useAnnotationStyles() + useInspectorCursor()
│   └── brand.ts                       — Luminantie: welke tekstkleur op de brandkleur past
├── context/
│   ├── annotation-context.tsx         — Provider: state, keyboard shortcuts, route tracking, runtime tokens
│   ├── use-annotations.ts             — Hook (throws als buiten provider)
│   └── use-annotations-safe.ts        — Hook (geeft defaults terug als buiten provider)
├── components/
│   ├── annotation-button.tsx          — Floating toggle button met counter
│   ├── annotation-panel.tsx           — Side panel: annotation list + feedback list + filters + search
│   ├── annotation-card.tsx            — Annotation card in panel
│   ├── annotation-marker.tsx          — Wrapper component: ring + badges + popover
│   ├── annotation-popover.tsx         — Gedeelde popover (marker, auto-marker én inspector)
│   ├── auto-annotation-markers.tsx    — Auto-discovers data-annotation-id elementen
│   ├── feedback-markers.tsx           — Floating feedback badges op elementen met comments
│   ├── inspector.tsx                  — Element picker: crosshair cursor, click-to-comment
│   ├── comment-thread.tsx             — Comment lijst
│   ├── comment-card.tsx               — Eén comment (thread én panel-lijst)
│   ├── comment-form.tsx               — Feedback submit formulier
│   ├── marker-badge.tsx               — De ronde badge, één implementatie voor alle drie de plekken
│   ├── marker-geometry.ts             — Badge-afmetingen en hoekposities
│   ├── status-pill.tsx                — Comment-status
│   └── type-badge.tsx                 — Annotatietype
├── hooks/
│   ├── use-comments.ts                — Fetch + submit comments voor specifiek annotationId (polls 30s)
│   └── use-all-comments.ts            — Fetch alle comments voor project (polls 30s)
└── utils/
    ├── cx.ts                          — Class names samenvoegen
    ├── format.ts                      — initials() + relativeTime() voor de comment-UI
    ├── drag.ts                        — Button/panel positioning + drag-to-corner logic
    ├── element-id.ts                  — getElementPath() CSS selector + getElementLabel() preview
    ├── find-element.ts                — findElementByAnnotationId() 3-tier lookup + highlight overlays
    ├── popover-position.ts            — Smart popover positioning (fixed + absolute varianten)
    ├── route-matching.ts              — Route matching, breadcrumb en navigatie
    └── use-stable-id.ts               — DOM-id voor label/veld-koppeling (React 17-safe)
```

## Inspector element snap logic

Wanneer een gebruiker een element klikt in inspector mode, wordt het element geidentificeerd via een 3-pass walk-up:

1. **data-annotation-id** — Loopt DOM tree op, zoekt eerste ancestor met `data-annotation-id` attribuut (voorgedefinieerde annotation markers). Skipt full-page containers (>90% viewport).
2. **id** — Als geen annotation_id gevonden, loopt opnieuw op zoekend naar `id` attribuut. Skipt full-page containers.
3. **CSS selector path** — Fallback: genereert pad als `#root > div > section:nth-of-type(2) > button`.

**Annotatie en feedback delen één id per component.** `AnnotationMarker` stempelt `data-annotation-id={annotationId}` op z'n wrapper. Klik je zo'n element aan in inspector mode, dan vindt pass 1 díe id — niet de element-`id` eronder of een CSS-pad. Zo landt nieuwe feedback in dezelfde bak als de annotatie, toont de annotatie-popover die feedback in z'n eigen sectie, en verschijnt er geen tweede losse feedback-pin (`FeedbackMarkers` slaat geregistreerde marker-id's over). Eén kaart, één thread.

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
- **Panel-header**: geen aparte titelbalk. Sleepgreep, de twee tabs en de sluitknop delen één rij. `labels.panelTitle` is nog steeds de `aria-label` van het paneel, maar staat niet meer als tekst boven twee tabs die al Annotaties en Feedback heten.
- **Losse annotaties krijgen tóch een marker.** Heeft een annotatie geen element op de pagina — `target: "global"`, of het element is nu niet gerenderd — dan parkeert `AutoAnnotationMarkers` de badge in een kolom linksboven (`unplacedBadgeRect()` in `marker-geometry.ts`), met een streepjesrand als teken dat hij nergens aan hangt. De popover opent daar. Zonder dat waren die annotaties alleen in het paneel te lezen.
- **Een annotatiekaart selecteert, hij klapt niet uit.** Klikken zet `activeAnnotationId`, waardoor de popover van die annotatie op de pagina opent — daar staat de volledige body. De kaart blijft op twee regels afgekapt: hij is een lijstingang, geen tweede kopie van de annotatie. Nog eens klikken sluit de popover.
  - Zit het element op deze pagina, dan wordt er ook naartoe gescrold en gehighlight.
  - Staat de annotatie op een andere route (tab "Alles"), dan navigeert de klik daar eerst heen; `activeAnnotationId` blijft staan, dus de popover opent zodra de marker daar rendert.
- **Een feedbackkaart werkt hetzelfde.** Klikken opent de thread als popover op de pagina, naast het element waar de feedback op zit. `FeedbackMarkers` rendert die popover; de kaart in het paneel blijft afgekapt (comment 3 regels, antwoord 2).
- **Losse feedback wordt ook geparkeerd.** Is het element van een comment verdwenen, dan krijgt de badge een plek in dezelfde kolom linksboven, onder de losse annotaties. `marker-placement.ts` bepaalt de volgorde, zodat `AutoAnnotationMarkers` en `FeedbackMarkers` niet in hetzelfde vakje tekenen.
- **Beide tabs tellen hetzelfde soort ding**: annotaties op deze pagina, en niet-opgeloste feedback op deze pagina.
- **AnnotationButton counter**: `currentAnnotations.length + openFeedbackCount` (page-gefilterd)
- **Feedback tab badge**: toont count van niet-opgeloste feedback op huidige pagina

## Server helpers (voor consuming projects)

Het package exporteert server-side helpers via `@strakzat/orbit/server` voor gebruik in API routes. **Gebruik deze altijd** bij het bouwen van een comments API — ze garanderen dat alle velden (inclusief `pagina`) correct worden opgeslagen.

```typescript
import { buildNotionCommentProperties, parseNotionComment } from "@strakzat/orbit/server";

// POST handler — bouwt alle Notion properties inclusief Pagina
const properties = buildNotionCommentProperties(
  { annotationId, auteur, comment, pagina, label },
  NOTION_PROJECT_ID
);
await fetch(`https://api.notion.com/v1/pages`, {
  method: "POST",
  headers: { Authorization: `Bearer ${NOTION_API_KEY}`, "Notion-Version": "2022-06-28", "Content-Type": "application/json" },
  body: JSON.stringify({ parent: { database_id: NOTION_DATABASE_ID }, properties }),
});

// GET handler — parsed Notion page → Comment object
const comments = data.results.map(parseNotionComment);
```

## Vite plugin (voor local dev)

Vite serveert geen Vercel serverless functions, dus `/api/comments` geeft een 404 tijdens local dev. Het package biedt een Vite plugin die de API middleware inline afhandelt:

```typescript
import { annotationsDevApi } from "@strakzat/orbit/vite";

export default defineConfig({
  plugins: [annotationsDevApi(), react()],
});
```

De plugin laadt `.env` uit de project root en waarschuwt als `NOTION_API_KEY`, `NOTION_DATABASE_ID` of `NOTION_PROJECT_ID` ontbreekt.

## Build & publish

```bash
npm run build     # tsup → dist/ (ESM + CJS + DTS)
npm version patch # bump version
npm publish       # publishes to GitHub Packages (npm.pkg.github.com)
```

Output: `dist/index.js` (CJS), `dist/index.mjs` (ESM), `dist/index.d.ts` (types). Client entry krijgt `"use client";` banner voor Next.js compatibiliteit. Server entry (`dist/server.*`) en Vite entry (`dist/vite.*`) hebben geen banner.

## Theming

Het package injecteert één stylesheet in `document.head` (`<style data-orbit-styles>`), de eerste keer dat een component mount. De consumer importeert niets. Alles is geprefixt met `orbit-`: elke class, elke variabele, elk data-attribuut.

### Waarom een stylesheet en niet inline styles

Zonder stylesheet bestaan `:focus-visible`, `:hover` en `prefers-reduced-motion` niet. Die ontbraken daardoor volledig — op twee plekken was de focus-outline zelfs actief weggehaald. Dat is de reden dat de ~880 regels inline `React.CSSProperties` vervangen zijn door classes.

Inline styles blijven alléén voor runtime-metingen: de positie van een popover, de rect van een gemarkeerd element, de door de gebruiker ingestelde `panelWidth`. `npm run check:tokens` faalt op alles daarbuiten.

### Isolatie

De module draait in de app van een klant, dus de CSS gaat twee kanten op lekken als je niet oppast. Drie maatregelen:

1. Elke selector draagt `orbit-`.
2. Elk element dat wij renderen draagt óók `.orbit-root`, en er is een reset op `.orbit-root, .orbit-root *`. Die weegt zwaarder dan een kale `button {}` of `* {}` uit de host.
3. De reset staat als eerste in de sheet, zodat de componentregels erna winnen bij gelijke specificiteit.

**Uitzondering:** `.orbit-marker-wrap` in `annotation-marker.tsx` draagt bewust géén `orbit-root`, want dat element omsluit de componenten van de klant zelf. De reset zou hun styling slopen.

Wat er nog wél doorheen komt: een host-regel met `!important`. Alleen `box-sizing` is daartegen verdedigd (met `!important`), omdat `content-box` elke breedte in de module kapotmaakt. Een geforceerd `font-family` komt er doorheen — cosmetisch, geen structurele schade.

### Dark mode

Volgt `prefers-color-scheme`. Handmatig te overrulen op `<html>`:

```js
document.documentElement.setAttribute("data-orbit-theme", "light"); // of "dark"
```

Let op: de module volgt het OS, ook als de host-app zelf alleen licht is. Zet het attribuut op `"light"` als de module mee moet met een app zonder dark mode. De attribuutnaam is geëxporteerd als `THEME_ATTR`.

### CSS-variabelen — publieke API

Overschrijf ze op `:root` of op een ancestor. Hernoemen is breaking, dus dat gebeurt met een major bump.

| Groep | Tokens |
|---|---|
| Achtergrond | `--orbit-bg-primary`, `-primary_hover`, `-secondary`, `-secondary_hover`, `-tertiary`, `-quaternary`, `-disabled` |
| Tekst | `--orbit-text-primary`, `-secondary`, `-tertiary`, `-quaternary`, `-disabled` |
| Rand | `--orbit-border-primary`, `-secondary`, `--orbit-border-input` |
| Popover | `POPOVER_MAX_HEIGHT` in `marker-geometry.ts`; `popover-position.ts` klemt dat af op de ruimte die er werkelijk is |
| Focus | `--orbit-outline-focus-ring` |
| Brand | `--orbit-brand` en de afgeleiden `--orbit-bg-brand-solid`, `-solid_hover`, `--orbit-bg-brand-primary`, `--orbit-border-brand`, `--orbit-text-brand-secondary`, `--orbit-text-primary_on-brand` |
| Status | `--orbit-bg-{error,warning,success}-primary`, `--orbit-border-{…}`, `--orbit-text-{…}-primary` |
| Feedback | `--orbit-bg-feedback`, `--orbit-border-feedback`, `--orbit-text-feedback`, `--orbit-bg-feedback-solid` |
| Overlay | `--orbit-overlay-fill`, `-fill-strong`, `--orbit-overlay-ring` |
| Type | `--orbit-type-{documentation,pro,question,con,suggestion,critical,user-insight}-{bg,border,fg}` |
| Schaal | `--orbit-space-*`, `--orbit-radius-*`, `--orbit-text-*`, `--orbit-shadow-*`, `--orbit-font-body`, `--orbit-font-mono` |
| Motion | `--orbit-duration-fast`, `--orbit-duration`, `--orbit-duration-slow`, `--orbit-ease` |
| Stapeling | `--orbit-z-base` (uit `settings.zIndex`) plus vaste offsets |

De naamgeving volgt de semantische laag van Untitled UI (`bg-primary`, `text-tertiary`, `*_hover`, `*_on-brand`), zodat het vocabulaire hetzelfde is als in onze Tailwind-projecten. De *waarden* zijn Geist: Vercels bijna-monochrome palet — witte/bijna-zwarte vlakken, hairline randen, één blauw voor de comment-laag, en een grote zachte schaduw op alles wat zweeft. Het lettertype is Geist eerst in de stack, met een val terug op het systeem (geen fontbestanden gebundeld). Tailwind zelf zit hier niet in: dat zou elke consumer een buildstap opleggen.

**`accentColor` tint, hij kleurt de primaire knop niet.** Eén kleur in `settings.accentColor` voedt `--orbit-brand`; daaruit worden de stille brand-tokens afgeleid met `color-mix()` — de subtiele vulling, de rand, de secundaire tekst. De solide brandknop (`--orbit-bg-brand-solid`) is bewust *niet* van de accent afgeleid: hij is een theme-aware constante — bijna-zwart in licht, bijna-wit in donker, Vercels omgekeerde primaire knop — zodat hij in beide thema's leesbaar blijft wat een consumer ook instelt. `onBrandTextColor()` blijft geëxporteerd voor wie zelf een brandknop bouwt.

### Wat bewust anders is

- **Geen JSX.** `React.createElement()` overal. Het package hoeft geen JSX transform en werkt in elke bundler.
- **Geen `@/`-alias.** `meridian:component-conventions` schrijft absolute imports voor, maar dit is een gepubliceerd package dat door tsup gebundeld wordt en één niveau diep is. Relatieve imports blijven.
- **Geen `@strakzat/eslint-config-ui`.** Die leest alleen `className`-literals en `clsx`/`cn`-argumenten; op dit package zou hij groen draaien zonder iets te zien. `npm run check:tokens` doet het equivalente werk voor hoe dit package geschreven is.
- **Geen ARIA-tablist in het paneel.** De twee views zijn toggle-knoppen met `aria-pressed`. Een `role="tablist"` belooft pijltjesnavigatie die we niet implementeren.

## Accessibility

- Elk interactief element heeft een zichtbare `:focus-visible` outline van 2px in `--orbit-outline-focus-ring` — de Vercel-blauw `#0070F3`.
- Content-grijstinten blijven ≥ 4.5:1 op `bg-primary`. `--orbit-text-quaternary` is `#737373` (4.74:1) — die tint draagt echte inhoud (auteurs, datums, breadcrumbs) en moet door WCAG 1.4.3. `--orbit-text-disabled` (`#A1A1A1`) is bewust decoratief.
- **Uitzondering:** `--orbit-border-input` is een hairline (`#E0E0E0`) en haalt de 3:1 van WCAG 1.4.11 niet op zichzelf. Bewuste keuze voor de Vercel-look; de focusring draagt de last. Overschrijf de token om de rand te verzwaren.
- Elk veld heeft een `<label>`; visueel verborgen met `.orbit-sr-only` waar het ontwerp er geen ruimte voor heeft.
- Kaarten met twee acties gebruiken een uitgerekte overlay-knop plus een link erboven, want een `<button>` mag geen `<button>` bevatten.
- Escape sluit paneel, popover en inspector, en geeft de focus terug aan de knop die ze opende.
- `prefers-reduced-motion: reduce` zet alle transities en animaties in de module op 0,01ms.
- Iconen zijn `aria-hidden`; de knop eromheen draagt de naam.

## Code patterns

- Alle components gebruiken `React.createElement()` — geen JSX.
- Geen externe dependencies buiten de React peer dep.
- `useAnnotationsSafe()` geeft safe defaults wanneer buiten AnnotationProvider — voorkomt crashes bij optioneel gebruik.
- `useAnnotationStyles()` staat in élk geëxporteerd component, niet alleen in de provider, omdat `useAnnotationsSafe()` gebruik buiten de provider toestaat. Een refcount zorgt dat de sheet één keer bestaat.
- Panel corner positie wordt opgeslagen in localStorage (`@strakzat/orbit:panelCorner`).
- Comments worden gepolled elke 30 seconden wanneer annotation mode of inspector actief is.

## Checks

```bash
npm run check        # typecheck + check:tokens
npm run check:tokens # geen ruwe kleur, geen styling terug in een inline style object
npm run build        # tsup → dist/
```

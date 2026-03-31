# @{{ORG_NAME}}/annotations

Centrale annotation engine. Één package, meerdere projecten.

## Concept

```
[Dit package]          [Elk project]
  Engine logic    →      annotationConfig.ts   (project-specifieke content)
  Toggle UI       →      <AnnotationProvider>  (in App.tsx)
  Badge/Tooltip   →      <Annotatable id="x"> (per component)
```

**Updates aan de engine** (dit package) → `npm update` in alle projecten → overal bijgewerkt  
**Updates aan content** → alleen in het specifieke project

---

## Installatie

```bash
npm install @{{ORG_NAME}}/annotations
```

Zorg dat je `.npmrc` verwijst naar GitHub Packages:
```
@{{ORG_NAME}}:registry=https://npm.pkg.github.com
```

---

## Gebruik

### 1. Provider in App.tsx

```tsx
import { AnnotationProvider } from "@{{ORG_NAME}}/annotations";
import { annotationConfig } from "@/annotations/config";

export default function App() {
  return (
    <AnnotationProvider config={annotationConfig}>
      {/* rest van je app */}
    </AnnotationProvider>
  );
}
```

### 2. Config in src/annotations/config.ts

```ts
import type { AnnotationConfig } from "@{{ORG_NAME}}/annotations";

export const annotationConfig: AnnotationConfig = {
  project: "Mijn Project",
  settings: {
    togglePosition: "bottom-right",
    defaultVisible: false,
  },
  annotations: {
    "mijn-feature": {
      title: "Hoe dit werkt",
      body: "Uitleg voor de klant...",
      type: "info", // info | tip | warning | new
    },
  },
};
```

### 3. Annotatable wrapper

```tsx
import { Annotatable } from "@{{ORG_NAME}}/annotations";

function MijnComponent() {
  return (
    <Annotatable id="mijn-feature">
      <div>... jouw UI ...</div>
    </Annotatable>
  );
}
```

---

## Annotation types

| Type      | Kleur  | Gebruik                          |
|-----------|--------|----------------------------------|
| `info`    | Blauw  | Algemene uitleg                  |
| `tip`     | Groen  | Handige tip voor de gebruiker    |
| `warning` | Oranje | Belangrijk, let op               |
| `new`     | Paars  | Nieuwe feature toelichting       |

---

## Een update deployen

```bash
# In dit package:
# 1. Maak je wijzigingen
# 2. Bump de versie
npm version patch   # bug fix
npm version minor   # nieuwe feature
npm version major   # breaking change

# 3. Publish
npm publish

# In elk project:
npm update @{{ORG_NAME}}/annotations
```

---

## Toekomstige uitbreidingen

- [ ] **Comment mode** — klanten kunnen replies typen, opgeslagen in Supabase/database
- [ ] **Mention system** — annotaties koppelen aan specifieke gebruikers
- [ ] **Read receipts** — bijhouden welke annotaties de klant heeft gezien
- [ ] **Export** — annotaties exporteren als PDF samenvatting

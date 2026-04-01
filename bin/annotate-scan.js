#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const readline = require("readline");

// ── Config ──────────────────────────────────────────────────────────────────

const UI_PATTERNS = [
  { pattern: /<(?:nav|Nav|Navbar|Navigation|Sidebar|Header|Footer)\b/g, label: "navigatie" },
  { pattern: /<(?:table|Table|DataTable|DataGrid)\b/g, label: "tabel" },
  { pattern: /<(?:form|Form|FormField|FormGroup)\b/g, label: "formulier" },
  { pattern: /<(?:Card|CardContent|DashboardCard|StatCard|InfoCard)\b/g, label: "card" },
  { pattern: /<(?:Filter|FilterBar|FilterGroup|SearchBar|Search)\b/g, label: "filter" },
  { pattern: /<(?:Modal|Dialog|Drawer|Sheet|AlertDialog)\b/g, label: "modal" },
  { pattern: /<(?:Tabs|TabList|TabPanel|TabGroup)\b/g, label: "tabs" },
  { pattern: /<(?:Chart|BarChart|LineChart|PieChart|AreaChart|Recharts)\b/g, label: "grafiek" },
  { pattern: /<(?:Hero|HeroSection|Banner|Jumbotron)\b/g, label: "hero" },
  { pattern: /<(?:List|ListView|DataList|OrderList)\b/g, label: "lijst" },
  { pattern: /<(?:Accordion|AccordionItem|Collapse|Expandable)\b/g, label: "accordion" },
  { pattern: /<(?:Pagination|Pager)\b/g, label: "paginering" },
  { pattern: /<(?:Breadcrumb|BreadcrumbItem)\b/g, label: "breadcrumb" },
  { pattern: /<(?:Stepper|Steps|StepIndicator)\b/g, label: "stepper" },
  { pattern: /<(?:Calendar|DatePicker|DateRangePicker)\b/g, label: "kalender" },
  { pattern: /<(?:Upload|FileUpload|Dropzone)\b/g, label: "upload" },
  { pattern: /<(?:Timeline|TimelineItem)\b/g, label: "timeline" },
  { pattern: /<(?:KPI|Metric|Stat|StatGroup|Statistics)\b/g, label: "KPI" },
];

// Patterns that indicate a page-level component (by filename or export)
const PAGE_PATTERNS = [
  /page\.(tsx|jsx)$/i,
  /Page\.(tsx|jsx)$/,
  /layout\.(tsx|jsx)$/i,
  /\/pages?\//i,
  /\/app\//i,
];

const COLORS = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
  red: "\x1b[31m",
  magenta: "\x1b[35m",
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function c(color, text) {
  return `${COLORS[color]}${text}${COLORS.reset}`;
}

function findFiles(dir, extensions) {
  const results = [];
  if (!fs.existsSync(dir)) return results;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      // Skip common non-component directories
      if (["node_modules", ".next", ".git", "dist", "build", ".turbo"].includes(entry.name)) continue;
      results.push(...findFiles(fullPath, extensions));
    } else if (extensions.some((ext) => entry.name.endsWith(ext))) {
      results.push(fullPath);
    }
  }
  return results;
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function getComponentName(filePath) {
  const base = path.basename(filePath, path.extname(filePath));
  // page.tsx → use parent dir name
  if (base === "page" || base === "layout") {
    return path.basename(path.dirname(filePath));
  }
  return base;
}

function isPageFile(filePath) {
  return PAGE_PATTERNS.some((p) => p.test(filePath));
}

function scanFile(filePath, rootDir) {
  const content = fs.readFileSync(filePath, "utf-8");
  const relativePath = path.relative(rootDir, filePath);
  const componentName = getComponentName(filePath);

  const hasAnnotationMarker = content.includes("<AnnotationMarker") || content.includes("AnnotationMarker");
  const hasAnnotatable = content.includes("<Annotatable") || content.includes("Annotatable");
  const isAlreadyAnnotated = hasAnnotationMarker || hasAnnotatable;

  const suggestions = [];

  // Check if it's a page component
  if (isPageFile(filePath)) {
    suggestions.push({
      type: "pagina",
      component: componentName,
      line: 1,
      context: `Pagina-component: ${componentName}`,
    });
  }

  // Scan for UI patterns
  for (const { pattern, label } of UI_PATTERNS) {
    // Reset regex state
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(content)) !== null) {
      // Find the line number
      const linesBefore = content.slice(0, match.index).split("\n");
      const lineNum = linesBefore.length;
      const matchedTag = match[0].replace("<", "").trim();

      suggestions.push({
        type: label,
        component: matchedTag,
        line: lineNum,
        context: content.split("\n")[lineNum - 1]?.trim().slice(0, 80) || "",
      });
    }
  }

  if (suggestions.length === 0) return null;

  return {
    filePath,
    relativePath,
    componentName,
    isAlreadyAnnotated,
    suggestions,
    content,
  };
}

// ── JSX modification ────────────────────────────────────────────────────────

function addImportIfNeeded(content) {
  if (content.includes("AnnotationMarker")) return content;

  // Find the last import statement
  const importRegex = /^import\s.+$/gm;
  let lastImport = null;
  let match;
  while ((match = importRegex.exec(content)) !== null) {
    lastImport = match;
  }

  const importLine = 'import { AnnotationMarker } from "@jasperdenouden92/annotations";';

  if (lastImport) {
    const insertAt = lastImport.index + lastImport[0].length;
    return content.slice(0, insertAt) + "\n" + importLine + content.slice(insertAt);
  }

  return importLine + "\n" + content;
}

function wrapElement(content, suggestion, annotationId) {
  const lines = content.split("\n");
  const lineIndex = suggestion.line - 1;
  const line = lines[lineIndex];
  if (!line) return content;

  const indent = line.match(/^(\s*)/)?.[1] || "";

  // Find the JSX tag in this line
  const tagMatch = line.match(new RegExp(`(<${suggestion.component.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`));
  if (!tagMatch) return content;

  // Check if self-closing tag on same line
  const isSelfClosing = line.includes("/>");
  if (isSelfClosing) {
    // Wrap single line: <Card ... /> → <AnnotationMarker annotationId="x"><Card ... /></AnnotationMarker>
    lines[lineIndex] =
      `${indent}<AnnotationMarker annotationId="${annotationId}">\n` +
      `${indent}  ${line.trim()}\n` +
      `${indent}</AnnotationMarker>`;
  } else {
    // Find closing tag
    const tagName = suggestion.component;
    let depth = 0;
    let closeLineIndex = -1;

    for (let i = lineIndex; i < lines.length; i++) {
      const l = lines[i];
      // Count opening tags (but not self-closing)
      const opens = (l.match(new RegExp(`<${tagName}[\\s>]`, "g")) || []).length;
      const selfCloses = (l.match(new RegExp(`<${tagName}[^>]*/>`, "g")) || []).length;
      const closes = (l.match(new RegExp(`</${tagName}>`, "g")) || []).length;

      depth += opens - selfCloses - closes;
      if (depth <= 0 && i >= lineIndex) {
        closeLineIndex = i;
        break;
      }
    }

    if (closeLineIndex === -1) {
      // Can't find closing tag — wrap just this line
      lines[lineIndex] = `${indent}<AnnotationMarker annotationId="${annotationId}">\n${line}`;
      // Insert closing after same line
      lines.splice(lineIndex + 1, 0, `${indent}</AnnotationMarker>`);
    } else {
      // Wrap opening → closing
      lines[lineIndex] = `${indent}<AnnotationMarker annotationId="${annotationId}">\n${line}`;
      lines[closeLineIndex] = `${lines[closeLineIndex]}\n${indent}</AnnotationMarker>`;
    }
  }

  return lines.join("\n");
}

// ── Annotation data file ────────────────────────────────────────────────────

function getAnnotationsFilePath(rootDir) {
  // Check common locations
  const candidates = [
    path.join(rootDir, "src", "annotations", "data.ts"),
    path.join(rootDir, "src", "annotations", "config.ts"),
    path.join(rootDir, "src", "config", "annotations.ts"),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }

  // Default: create src/annotations/data.ts
  return path.join(rootDir, "src", "annotations", "data.ts");
}

function readExistingAnnotations(filePath) {
  if (!fs.existsSync(filePath)) return [];

  const content = fs.readFileSync(filePath, "utf-8");
  const ids = [];
  const idRegex = /id:\s*["']([^"']+)["']/g;
  let match;
  while ((match = idRegex.exec(content)) !== null) {
    ids.push(match[1]);
  }
  return ids;
}

function generateAnnotationEntry(id, suggestion, componentName, route) {
  return {
    id,
    target: route,
    title: `${suggestion.type}: ${componentName}`,
    body: `Annotatie voor ${suggestion.type} in ${componentName}`,
    author: "annotate-scan",
    date: new Date().toISOString().split("T")[0],
    type: "documentation",
  };
}

function writeAnnotationsFile(filePath, entries) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  if (fs.existsSync(filePath)) {
    // Append to existing array
    let content = fs.readFileSync(filePath, "utf-8");

    // Find the closing bracket of the array
    const arrayEnd = content.lastIndexOf("]");
    if (arrayEnd !== -1) {
      const newEntries = entries
        .map(
          (e) =>
            `  {\n    id: "${e.id}",\n    target: "${e.target}",\n    title: "${e.title}",\n    body: "${e.body}",\n    author: "${e.author}",\n    date: "${e.date}",\n    type: "${e.type}",\n  }`
        )
        .join(",\n");

      // Check if array has items already (needs comma)
      const beforeEnd = content.slice(0, arrayEnd).trimEnd();
      const needsComma = beforeEnd.endsWith("}") || beforeEnd.endsWith(",");

      content =
        content.slice(0, arrayEnd) +
        (needsComma && !beforeEnd.endsWith(",") ? ",\n" : "\n") +
        newEntries +
        "\n" +
        content.slice(arrayEnd);

      fs.writeFileSync(filePath, content, "utf-8");
      return;
    }
  }

  // Create new file
  const entriesStr = entries
    .map(
      (e) =>
        `  {\n    id: "${e.id}",\n    target: "${e.target}",\n    title: "${e.title}",\n    body: "${e.body}",\n    author: "${e.author}",\n    date: "${e.date}",\n    type: "${e.type}" as const,\n  }`
    )
    .join(",\n");

  const content = `import type { Annotation } from "@jasperdenouden92/annotations";

export const annotations: Annotation[] = [
${entriesStr}
];
`;

  fs.writeFileSync(filePath, content, "utf-8");
}

// ── Interactive prompt ──────────────────────────────────────────────────────

function ask(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase());
    });
  });
}

// ── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const rootDir = args[0] ? path.resolve(args[0]) : process.cwd();
  const srcDir = path.join(rootDir, "src");

  console.log("");
  console.log(c("bold", "  📋 annotate-scan"));
  console.log(c("dim", `  Scanning ${path.relative(process.cwd(), srcDir) || "src/"}...\n`));

  if (!fs.existsSync(srcDir)) {
    console.log(c("red", "  ✗ src/ map niet gevonden. Draai dit vanuit de root van je project.\n"));
    process.exit(1);
  }

  const files = findFiles(srcDir, [".tsx", ".jsx"]);

  if (files.length === 0) {
    console.log(c("yellow", "  Geen .tsx/.jsx bestanden gevonden in src/\n"));
    process.exit(0);
  }

  console.log(c("dim", `  ${files.length} componenten gevonden\n`));

  // Scan all files
  const results = files.map((f) => scanFile(f, rootDir)).filter(Boolean);

  if (results.length === 0) {
    console.log(c("green", "  ✓ Geen annoteerbare UI-secties gevonden. Alles ziet er goed uit!\n"));
    process.exit(0);
  }

  // Display results
  let totalSuggestions = 0;
  let alreadyAnnotated = 0;

  for (const result of results) {
    const statusIcon = result.isAlreadyAnnotated ? c("green", "✓") : c("yellow", "○");
    console.log(`  ${statusIcon} ${c("bold", result.relativePath)}`);

    if (result.isAlreadyAnnotated) {
      console.log(c("dim", "    Heeft al AnnotationMarker imports\n"));
      alreadyAnnotated++;
      continue;
    }

    for (const s of result.suggestions) {
      totalSuggestions++;
      console.log(
        `    ${c("cyan", `[${s.type}]`)} ${c("bold", s.component)} ${c("dim", `(regel ${s.line})`)}`
      );
      if (s.context) {
        console.log(`    ${c("dim", s.context)}`);
      }
    }
    console.log("");
  }

  // Summary
  console.log(c("dim", "  ─────────────────────────────────────────"));
  console.log(
    `  ${c("bold", String(totalSuggestions))} suggesties in ${c("bold", String(results.length - alreadyAnnotated))} bestanden`
  );
  if (alreadyAnnotated > 0) {
    console.log(`  ${c("green", String(alreadyAnnotated))} bestanden al geannoteerd`);
  }
  console.log("");

  if (totalSuggestions === 0) {
    console.log(c("green", "  ✓ Alle UI-secties zijn al geannoteerd!\n"));
    process.exit(0);
  }

  // Ask to auto-apply
  const answer = await ask(
    `  ${c("yellow", "?")} Wil je dat ik deze markers automatisch toevoeg? ${c("dim", "(ja/nee)")} `
  );

  if (answer !== "ja" && answer !== "j" && answer !== "yes" && answer !== "y") {
    console.log(c("dim", "\n  Geen wijzigingen gemaakt.\n"));
    process.exit(0);
  }

  console.log("");

  // Apply changes
  const annotationsFile = getAnnotationsFilePath(rootDir);
  const existingIds = readExistingAnnotations(annotationsFile);
  const newAnnotationEntries = [];
  let filesModified = 0;

  for (const result of results) {
    if (result.isAlreadyAnnotated) continue;

    let content = result.content;
    let modified = false;

    // Add import first, then track the line offset it introduces
    const hadImport = content.includes("AnnotationMarker");
    content = addImportIfNeeded(content);
    const lineOffset = hadImport ? 0 : 1;

    // Process suggestions in reverse line order to preserve line numbers
    const sorted = [...result.suggestions].sort((a, b) => b.line - a.line);

    for (const suggestion of sorted) {
      const baseId = slugify(`${result.componentName}-${suggestion.type}`);
      let annotationId = baseId;
      let counter = 2;
      while (existingIds.includes(annotationId)) {
        annotationId = `${baseId}-${counter}`;
        counter++;
      }
      existingIds.push(annotationId);

      // Determine route from file path
      let route = "/";
      const relPath = result.relativePath;
      if (relPath.includes("/app/")) {
        const routePart = relPath.split("/app/")[1]?.replace(/\/page\.(tsx|jsx)$/, "") || "";
        route = "/" + routePart.replace(/\([^)]+\)\/?/g, "");
      } else if (relPath.includes("/pages/")) {
        const routePart = relPath.split("/pages/")[1]?.replace(/\.(tsx|jsx)$/, "") || "";
        route = "/" + routePart.replace(/index$/, "");
      }
      if (route !== "/" && route.endsWith("/")) route = route.slice(0, -1);

      // Adjust line number for the added import line
      const adjusted = { ...suggestion, line: suggestion.line + lineOffset };
      content = wrapElement(content, adjusted, annotationId);

      newAnnotationEntries.push(
        generateAnnotationEntry(annotationId, suggestion, result.componentName, route)
      );

      modified = true;
    }

    if (modified) {
      fs.writeFileSync(result.filePath, content, "utf-8");
      filesModified++;
      console.log(`  ${c("green", "✓")} ${result.relativePath}`);
    }
  }

  // Write annotation data
  if (newAnnotationEntries.length > 0) {
    writeAnnotationsFile(annotationsFile, newAnnotationEntries);
    const relAnnotationsPath = path.relative(rootDir, annotationsFile);
    console.log(`\n  ${c("green", "✓")} ${newAnnotationEntries.length} annotaties toegevoegd aan ${c("bold", relAnnotationsPath)}`);
  }

  console.log(
    `\n  ${c("green", "Klaar!")} ${filesModified} bestanden aangepast, ${newAnnotationEntries.length} markers toegevoegd.\n`
  );

  // Hint
  console.log(c("dim", "  Tip: Pas de titels en beschrijvingen aan in het annotatie-bestand."));
  console.log(c("dim", "  Tip: Gebruik annotationId als id-attribuut op je elementen voor stabiele markers.\n"));
}

main().catch((err) => {
  console.error(c("red", `\n  Fout: ${err.message}\n`));
  process.exit(1);
});

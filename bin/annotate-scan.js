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
  if (base === "page" || base === "layout") {
    return path.basename(path.dirname(filePath));
  }
  return base;
}

function isPageFile(filePath) {
  return PAGE_PATTERNS.some((p) => p.test(filePath));
}

// ── Scanning ────────────────────────────────────────────────────────────────

function scanFile(filePath, rootDir) {
  const content = fs.readFileSync(filePath, "utf-8");
  const relativePath = path.relative(rootDir, filePath);
  const componentName = getComponentName(filePath);

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
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const linesBefore = content.slice(0, match.index).split("\n");
      const lineNum = linesBefore.length;
      const matchedTag = match[0].replace("<", "").trim();
      const lineContent = content.split("\n")[lineNum - 1] || "";

      // Check if this element already has a data-annotation-id
      // Look ahead from the match to find the closing > of this tag
      const tagStart = match.index;
      const tagEnd = content.indexOf(">", tagStart);
      const tagSlice = tagEnd !== -1 ? content.slice(tagStart, tagEnd + 1) : "";
      const alreadyHasId = tagSlice.includes("data-annotation-id");

      suggestions.push({
        type: label,
        component: matchedTag,
        line: lineNum,
        context: lineContent.trim().slice(0, 80),
        alreadyHasId,
      });
    }
  }

  if (suggestions.length === 0) return null;

  return {
    filePath,
    relativePath,
    componentName,
    suggestions,
    content,
  };
}

// ── Adding data-annotation-id to elements ───────────────────────────────────

function addIdToElement(content, suggestion, annotationId) {
  const lines = content.split("\n");
  const lineIndex = suggestion.line - 1;
  const line = lines[lineIndex];
  if (!line) return content;

  // Find the tag opening in this line
  const escapedComponent = suggestion.component.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const tagMatch = line.match(new RegExp(`(<${escapedComponent})(\\s|>|/>|$)`));
  if (!tagMatch) return content;

  // Insert data-annotation-id after the tag name
  const insertPos = tagMatch.index + tagMatch[1].length;
  const before = line.slice(0, insertPos);
  const after = line.slice(insertPos);

  lines[lineIndex] = `${before} data-annotation-id="${annotationId}"${after}`;

  return lines.join("\n");
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

// ── Collect all existing IDs in the project ─────────────────────────────────

function collectExistingIds(files) {
  const ids = new Set();
  for (const filePath of files) {
    const content = fs.readFileSync(filePath, "utf-8");
    const regex = /data-annotation-id=["']([^"']+)["']/g;
    let match;
    while ((match = regex.exec(content)) !== null) {
      ids.add(match[1]);
    }
  }
  return ids;
}

// ── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const rootDir = args[0] ? path.resolve(args[0]) : process.cwd();
  const srcDir = path.join(rootDir, "src");

  console.log("");
  console.log(c("bold", "  🏷️  annotate-scan"));
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
    console.log(c("green", "  ✓ Geen UI-elementen gevonden om te labelen.\n"));
    process.exit(0);
  }

  // Display results
  let newSuggestions = 0;
  let alreadyLabeled = 0;

  for (const result of results) {
    const hasNew = result.suggestions.some((s) => !s.alreadyHasId);
    if (!hasNew) {
      alreadyLabeled++;
      continue;
    }

    console.log(`  ${c("yellow", "○")} ${c("bold", result.relativePath)}`);

    for (const s of result.suggestions) {
      if (s.alreadyHasId) {
        console.log(
          `    ${c("green", "✓")} ${c("dim", `[${s.type}]`)} ${c("dim", s.component)} ${c("dim", "(heeft al id)")}`
        );
      } else {
        newSuggestions++;
        console.log(
          `    ${c("cyan", `[${s.type}]`)} ${c("bold", s.component)} ${c("dim", `(regel ${s.line})`)}`
        );
        if (s.context) {
          console.log(`    ${c("dim", s.context)}`);
        }
      }
    }
    console.log("");
  }

  // Summary
  console.log(c("dim", "  ─────────────────────────────────────────"));
  console.log(
    `  ${c("bold", String(newSuggestions))} elementen zonder id gevonden`
  );
  if (alreadyLabeled > 0) {
    console.log(`  ${c("green", String(alreadyLabeled))} bestanden al volledig gelabeld`);
  }
  console.log("");

  if (newSuggestions === 0) {
    console.log(c("green", "  ✓ Alle UI-elementen hebben al een data-annotation-id!\n"));
    process.exit(0);
  }

  // Ask to auto-apply
  const answer = await ask(
    `  ${c("yellow", "?")} Wil je dat ik stabiele id's toevoeg aan deze elementen? ${c("dim", "(ja/nee)")} `
  );

  if (answer !== "ja" && answer !== "j" && answer !== "yes" && answer !== "y") {
    console.log(c("dim", "\n  Geen wijzigingen gemaakt.\n"));
    process.exit(0);
  }

  console.log("");

  // Collect existing IDs to avoid duplicates
  const existingIds = collectExistingIds(files);
  let filesModified = 0;
  let idsAdded = 0;

  for (const result of results) {
    const newItems = result.suggestions.filter((s) => !s.alreadyHasId);
    if (newItems.length === 0) continue;

    let content = result.content;

    // Process suggestions in reverse line order to preserve line numbers
    const sorted = [...newItems].sort((a, b) => b.line - a.line);

    for (const suggestion of sorted) {
      const baseId = slugify(`${result.componentName}-${suggestion.type}`);
      let annotationId = baseId;
      let counter = 2;
      while (existingIds.has(annotationId)) {
        annotationId = `${baseId}-${counter}`;
        counter++;
      }
      existingIds.add(annotationId);

      content = addIdToElement(content, suggestion, annotationId);
      idsAdded++;
    }

    fs.writeFileSync(result.filePath, content, "utf-8");
    filesModified++;
    console.log(`  ${c("green", "✓")} ${result.relativePath}`);
  }

  console.log(
    `\n  ${c("green", "Klaar!")} ${filesModified} bestanden aangepast, ${idsAdded} id's toegevoegd.\n`
  );

  console.log(c("dim", "  Elementen hebben nu een stabiel data-annotation-id attribuut."));
  console.log(c("dim", "  De feedback-inspector herkent deze id's automatisch."));
  console.log(c("dim", "  Annotaties kun je later handmatig toevoegen met AnnotationMarker.\n"));
}

main().catch((err) => {
  console.error(c("red", `\n  Fout: ${err.message}\n`));
  process.exit(1);
});

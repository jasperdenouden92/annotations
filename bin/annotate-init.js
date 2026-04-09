#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

// ── Config ──────────────────────────────────────────────────────────────────

const COLORS = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  red: "\x1b[31m",
};

const ANNOTATION_IMPORT = `import { AnnotationProvider, AnnotationButton, AnnotationPanel } from '@jasperdenouden92/annotations'`;
const DATA_IMPORT = `import { annotations } from './annotations/data'`;

const DATA_FILE_CONTENT = `export const annotations = []\n`;

// Entry points to search for, in priority order
const ENTRY_CANDIDATES = [
  "src/App.tsx",
  "src/App.jsx",
  "src/app/layout.tsx",
  "src/app/layout.jsx",
  "src/layouts/RootLayout.tsx",
  "src/layouts/RootLayout.jsx",
  "src/Layout.tsx",
  "src/Layout.jsx",
  "src/main.tsx",
  "src/main.jsx",
];

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

// ── Data file creation ──────────────────────────────────────────────────────

function ensureDataFile(rootDir) {
  const dataDir = path.join(rootDir, "src", "annotations");
  const dataFile = path.join(dataDir, "data.js");

  if (fs.existsSync(dataFile)) {
    console.log(`  ${c("green", "✓")} ${c("dim", "src/annotations/data.js bestaat al")}`);
    return false;
  }

  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  fs.writeFileSync(dataFile, DATA_FILE_CONTENT, "utf-8");
  console.log(`  ${c("green", "✓")} ${c("bold", "src/annotations/data.js")} aangemaakt`);
  return true;
}

// ── Layout file detection ───────────────────────────────────────────────────

function findLayoutFile(rootDir) {
  // First check known candidates
  for (const candidate of ENTRY_CANDIDATES) {
    const fullPath = path.join(rootDir, candidate);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, "utf-8");
      if (content.includes("useLocation")) {
        return fullPath;
      }
    }
  }

  // Fallback: scan src/ for any file that uses useLocation
  const srcDir = path.join(rootDir, "src");
  const files = findFiles(srcDir, [".tsx", ".jsx"]);
  for (const filePath of files) {
    const content = fs.readFileSync(filePath, "utf-8");
    if (content.includes("useLocation") && content.includes("react-router")) {
      return filePath;
    }
  }

  return null;
}

// ── Layout file injection ───────────────────────────────────────────────────

function hasAnnotationSetup(content) {
  return content.includes("AnnotationProvider") || content.includes("@jasperdenouden92/annotations");
}

function injectImports(content, layoutRelPath) {
  const lines = content.split("\n");

  // Find the last import line
  let lastImportIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    if (/^\s*import\s/.test(lines[i])) {
      // Walk past multi-line imports
      let j = i;
      while (j < lines.length && !lines[j].includes(";") && !lines[j].match(/['"]$/)) {
        j++;
      }
      lastImportIndex = j;
    }
  }

  if (lastImportIndex === -1) {
    // No imports found, add at top
    lastImportIndex = 0;
  }

  // Compute relative path from layout file to data file
  const layoutDir = path.dirname(layoutRelPath);
  let dataRelative = path.relative(layoutDir, "src/annotations/data").replace(/\\/g, "/");
  if (!dataRelative.startsWith(".")) {
    dataRelative = "./" + dataRelative;
  }

  const dataImport = `import { annotations } from '${dataRelative}'`;

  const newLines = [...lines];
  newLines.splice(lastImportIndex + 1, 0, ANNOTATION_IMPORT, dataImport);

  return newLines.join("\n");
}

function wrapWithProvider(content) {
  // Strategy: find the component that calls useLocation(), then wrap its return JSX.
  //
  // We look for the pattern:
  //   const location = useLocation()
  // Then find the return statement's JSX and wrap it with AnnotationProvider.

  // Find the location variable name
  const locationMatch = content.match(/const\s+(\w+)\s*=\s*useLocation\(\)/);
  if (!locationMatch) {
    return null;
  }
  const locationVar = locationMatch[1];

  // Find the return ( ... ) block
  // We need to find "return (" and then match the balanced parens
  const returnIndex = findReturnStatement(content);
  if (returnIndex === -1) {
    return null;
  }

  // Find the opening paren after return
  const afterReturn = content.indexOf("(", returnIndex);
  if (afterReturn === -1) {
    return null;
  }

  // Find matching closing paren
  const closeIndex = findMatchingParen(content, afterReturn);
  if (closeIndex === -1) {
    return null;
  }

  // Get the inner JSX content
  const innerJsx = content.slice(afterReturn + 1, closeIndex);

  // Find the last closing tag before the end — we want to insert AnnotationButton + AnnotationPanel
  // before the outermost closing tag
  const trimmedJsx = innerJsx.trimEnd();
  const lastCloseTagMatch = trimmedJsx.match(/(<\/\w+>)\s*$/);

  // Detect base indentation from the original JSX
  const jsxLines = innerJsx.split("\n").filter((l) => l.trim().length > 0);
  const baseIndent = jsxLines.length > 0
    ? jsxLines[0].match(/^(\s*)/)[1]
    : "    ";
  const indent = baseIndent || "    ";

  let wrappedJsx;
  if (lastCloseTagMatch) {
    const insertPos = trimmedJsx.lastIndexOf(lastCloseTagMatch[1]);
    const before = trimmedJsx.slice(0, insertPos);
    const closingTag = lastCloseTagMatch[1];

    wrappedJsx =
      `\n${indent}<AnnotationProvider annotations={annotations} currentRoute={${locationVar}.pathname}>\n` +
      `${before.trimEnd()}\n` +
      `${indent}  <AnnotationButton />\n` +
      `${indent}  <AnnotationPanel />\n` +
      `${indent}${closingTag}\n` +
      `${indent}</AnnotationProvider>\n  `;
  } else {
    wrappedJsx =
      `\n${indent}<AnnotationProvider annotations={annotations} currentRoute={${locationVar}.pathname}>\n` +
      `${innerJsx.trimEnd()}\n` +
      `${indent}  <AnnotationButton />\n` +
      `${indent}  <AnnotationPanel />\n` +
      `${indent}</AnnotationProvider>\n  `;
  }

  return content.slice(0, afterReturn + 1) + wrappedJsx + content.slice(closeIndex);
}

function findReturnStatement(content) {
  // Find "return" that's followed by "(" — the main component return
  // We want the return that's inside the component with useLocation
  const locationIndex = content.indexOf("useLocation()");
  if (locationIndex === -1) return -1;

  // Search for return statements after useLocation
  const regex = /\breturn\s*\(/g;
  regex.lastIndex = locationIndex;
  const match = regex.exec(content);
  return match ? match.index : -1;
}

function findMatchingParen(content, openIndex) {
  let depth = 0;
  for (let i = openIndex; i < content.length; i++) {
    const ch = content[i];
    if (ch === "(") depth++;
    else if (ch === ")") {
      depth--;
      if (depth === 0) return i;
    }
    // Skip string literals
    if (ch === '"' || ch === "'" || ch === "`") {
      const quote = ch;
      i++;
      while (i < content.length && content[i] !== quote) {
        if (content[i] === "\\") i++;
        i++;
      }
    }
  }
  return -1;
}

// ── Main ────────────────────────────────────────────────────────────────────

function main() {
  const args = process.argv.slice(2);
  const rootDir = args[0] ? path.resolve(args[0]) : process.cwd();
  const srcDir = path.join(rootDir, "src");

  console.log("");
  console.log(c("bold", "  annotate-init"));
  console.log(c("dim", `  Setting up annotations in ${path.relative(process.cwd(), rootDir) || "."}...\n`));

  if (!fs.existsSync(srcDir)) {
    console.log(c("red", "  ✗ src/ map niet gevonden. Draai dit vanuit de root van je project.\n"));
    process.exit(1);
  }

  // Step 1: Create data file
  console.log(c("dim", "  ─ Data file ─────────────────────────────"));
  const dataCreated = ensureDataFile(rootDir);
  console.log("");

  // Step 2: Find and modify layout file
  console.log(c("dim", "  ─ Layout file ───────────────────────────"));
  const layoutFile = findLayoutFile(rootDir);

  if (!layoutFile) {
    console.log(`  ${c("yellow", "!")} Geen layout-bestand gevonden met useLocation().`);
    console.log(c("dim", "  Voeg handmatig de AnnotationProvider toe aan je root layout.\n"));
    console.log(c("dim", "  Voorbeeld:"));
    console.log(c("dim", `  ${ANNOTATION_IMPORT}`));
    console.log(c("dim", `  ${DATA_IMPORT}\n`));
    console.log(c("dim", "  <AnnotationProvider annotations={annotations} currentRoute={location.pathname}>"));
    console.log(c("dim", "    {/* je app */}"));
    console.log(c("dim", "    <AnnotationButton />"));
    console.log(c("dim", "    <AnnotationPanel />"));
    console.log(c("dim", "  </AnnotationProvider>\n"));

    if (dataCreated) {
      console.log(c("green", "  Klaar!") + " Data-bestand aangemaakt, layout moet handmatig worden aangepast.\n");
    }
    process.exit(0);
  }

  const layoutRelPath = path.relative(rootDir, layoutFile);
  const content = fs.readFileSync(layoutFile, "utf-8");

  if (hasAnnotationSetup(content)) {
    console.log(`  ${c("green", "✓")} ${c("dim", `${layoutRelPath} heeft al AnnotationProvider`)}`);
    console.log(`\n  ${c("green", "Alles is al geconfigureerd!")}\n`);
    process.exit(0);
  }

  console.log(`  ${c("cyan", "○")} Gevonden: ${c("bold", layoutRelPath)}`);

  // Inject imports
  let modified = injectImports(content, layoutRelPath);

  // Wrap JSX with provider
  const wrapped = wrapWithProvider(modified);
  if (!wrapped) {
    console.log(`  ${c("yellow", "!")} Kon return JSX niet automatisch wrappen.`);
    console.log(c("dim", "  Imports zijn toegevoegd — wrap handmatig met AnnotationProvider.\n"));
    fs.writeFileSync(layoutFile, modified, "utf-8");
    console.log(`  ${c("green", "✓")} ${c("bold", layoutRelPath)} aangepast (imports toegevoegd)\n`);
    process.exit(0);
  }

  fs.writeFileSync(layoutFile, wrapped, "utf-8");
  console.log(`  ${c("green", "✓")} ${c("bold", layoutRelPath)} aangepast`);
  console.log(c("dim", "    + imports toegevoegd"));
  console.log(c("dim", "    + AnnotationProvider wrapper toegevoegd"));
  console.log(c("dim", "    + AnnotationButton & AnnotationPanel toegevoegd"));

  // Summary
  console.log("");
  console.log(c("dim", "  ─────────────────────────────────────────"));
  console.log(`  ${c("green", "Klaar!")} Annotaties zijn geconfigureerd.\n`);
  console.log(c("dim", "  Volgende stappen:"));
  console.log(c("dim", "  1. Voeg annotaties toe in src/annotations/data.js"));
  console.log(c("dim", "  2. Draai annotate-scan om data-annotation-id's te plaatsen"));
  console.log(c("dim", "  3. Start je app en druk op Cmd+. om het paneel te openen\n"));
}

main();

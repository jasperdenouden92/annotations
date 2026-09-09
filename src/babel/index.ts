/**
 * Babel plugin that annotates host JSX elements with their source location and
 * the name of the enclosing React component, so the Orbit Inspector can report
 * exactly where a clicked element lives in the codebase.
 *
 * For every host element (a lowercase JSX tag such as `<button>`), it injects:
 *   - `data-orbit-source="src/components/Card.tsx:33"`
 *   - `data-orbit-component="Card"`
 *
 * Component elements (`<Card/>`, `<AnnotationMarker/>`) are skipped so no unknown
 * DOM props leak into user components.
 *
 * Intended for dev/staging builds only. Wire it up conditionally in Vite:
 *
 *   import { orbitSource } from "@jasperdenouden92/annotations/babel";
 *   react({ babel: { plugins: mode !== "production" ? [orbitSource()] : [] } });
 *
 * Build staging with a non-production mode (e.g. `vite build --mode staging`) so
 * the plugin runs; production builds stay clean.
 */
import type { PluginObj, PluginPass, types as BabelTypes } from "@babel/core";
import type { NodePath } from "@babel/traverse";

const SOURCE_ATTR = "data-orbit-source";
const COMPONENT_ATTR = "data-orbit-component";

interface Babel {
  types: typeof BabelTypes;
}

export function orbitSource() {
  return function orbitSourcePlugin({ types: t }: Babel): PluginObj<PluginPass> {
    return {
      name: "orbit-source",
      visitor: {
        JSXOpeningElement(path: NodePath<BabelTypes.JSXOpeningElement>, state: PluginPass) {
          const nameNode = path.node.name;

          // Only host elements: <div>, <button>, ... — skip <Component/> and namespaced/member tags.
          if (!t.isJSXIdentifier(nameNode)) return;
          const tagName = nameNode.name;
          if (!/^[a-z]/.test(tagName)) return;

          // Don't double-annotate.
          const alreadyAnnotated = path.node.attributes.some(
            (attr) =>
              t.isJSXAttribute(attr) &&
              t.isJSXIdentifier(attr.name) &&
              attr.name.name === SOURCE_ATTR
          );
          if (alreadyAnnotated) return;

          const line = path.node.loc?.start.line;
          if (!line) return;

          const filename = relativeFilename(state);
          if (!filename) return;

          path.node.attributes.push(
            t.jsxAttribute(
              t.jsxIdentifier(SOURCE_ATTR),
              t.stringLiteral(`${filename}:${line}`)
            )
          );

          const component = enclosingComponentName(path);
          if (component) {
            path.node.attributes.push(
              t.jsxAttribute(
                t.jsxIdentifier(COMPONENT_ATTR),
                t.stringLiteral(component)
              )
            );
          }
        },
      },
    };
  };
}

function relativeFilename(state: PluginPass): string | undefined {
  const filename = state.file.opts.filename;
  if (!filename) return undefined;
  const cwd = state.file.opts.cwd ?? process.cwd();
  let rel = filename.startsWith(cwd) ? filename.slice(cwd.length) : filename;
  rel = rel.replace(/^[/\\]+/, "").replace(/\\/g, "/");
  return rel;
}

function enclosingComponentName(path: NodePath): string | undefined {
  let current: NodePath | null = path;
  while (current) {
    const node = current.node;

    // function Card() {}
    if (
      (node.type === "FunctionDeclaration" || node.type === "ClassDeclaration") &&
      node.id?.name
    ) {
      if (isComponentName(node.id.name)) return node.id.name;
    }

    // const Card = () => {}  /  const Card = function () {}
    if (node.type === "VariableDeclarator" && node.id.type === "Identifier") {
      const init = node.init;
      if (
        init &&
        (init.type === "ArrowFunctionExpression" || init.type === "FunctionExpression")
      ) {
        if (isComponentName(node.id.name)) return node.id.name;
      }
    }

    current = current.parentPath;
  }
  return undefined;
}

function isComponentName(name: string): boolean {
  // React components are PascalCase; ignore lowercase helpers/hooks.
  return /^[A-Z]/.test(name);
}

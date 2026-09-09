import { describe, it, expect } from "vitest";
import { transformSync } from "@babel/core";
import { orbitSource } from "../index";

function transform(code: string, filename = "src/components/Card.tsx"): string {
  const out = transformSync(code, {
    filename,
    cwd: process.cwd(),
    babelrc: false,
    configFile: false,
    plugins: [orbitSource(), "@babel/plugin-syntax-jsx"],
  });
  return out?.code ?? "";
}

describe("orbitSource babel plugin", () => {
  it("annotates host elements with source and component", () => {
    const code = `function Card() { return <button>Go</button>; }`;
    const out = transform(code);
    expect(out).toContain('data-orbit-source="src/components/Card.tsx:1"');
    expect(out).toContain('data-orbit-component="Card"');
  });

  it("does not annotate component elements", () => {
    const code = `function Card() { return <DashboardCard title="x" />; }`;
    const out = transform(code);
    expect(out).not.toContain("data-orbit-source");
    expect(out).not.toContain("data-orbit-component");
  });

  it("resolves the component name for arrow-function components", () => {
    const code = `const Panel = () => <div><span>hi</span></div>;`;
    const out = transform(code);
    expect(out).toContain('data-orbit-component="Panel"');
  });

  it("does not double-annotate an element that already has the attribute", () => {
    const code = `function Card() { return <button data-orbit-source="x">Go</button>; }`;
    const out = transform(code);
    const matches = out.match(/data-orbit-source/g) ?? [];
    expect(matches).toHaveLength(1);
  });
});

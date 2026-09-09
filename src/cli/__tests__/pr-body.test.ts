import { describe, it, expect } from "vitest";
import type { FeedbackItem } from "../../types";
import {
  renderPrBody,
  parsePrBody,
  parsePrMeta,
} from "../pr-body";

function item(overrides: Partial<FeedbackItem>): FeedbackItem {
  return {
    id: "00000000-0000-0000-0000-000000000000",
    project: "demo",
    annotationId: "#root > button",
    label: "<button> Export",
    pagina: "/dashboard",
    auteur: "Elwin",
    comment: "Knop moet rechts",
    component: "DashboardCard",
    bron: "src/DashboardCard.tsx:33",
    status: "In behandeling",
    antwoord: null,
    pr: "",
    aangemaakt: "2026-09-09T10:00:00.000Z",
    ...overrides,
  };
}

describe("pr-body render + parse round-trip", () => {
  const processed = [
    { item: item({ id: "11111111-1111-1111-1111-111111111111" }), shortSha: "abc1234" },
    { item: item({ id: "22222222-2222-2222-2222-222222222222" }), shortSha: "def5678" },
  ];
  const notProcessed = [
    {
      item: item({ id: "33333333-3333-3333-3333-333333333333", comment: "Mooi!" }),
      reason: "Geen codewijziging nodig.",
    },
  ];

  const body = renderPrBody({
    project: "demo",
    date: "2026-09-09",
    base: "main",
    processed,
    notProcessed,
  });

  it("marks processed items checked and not-processed items unlisted as checkboxes", () => {
    const entries = parsePrBody(body);
    expect(entries).toEqual([
      { id: "11111111-1111-1111-1111-111111111111", checked: true },
      { id: "22222222-2222-2222-2222-222222222222", checked: true },
    ]);
  });

  it("detects an unchecked box after a human edit", () => {
    const edited = body.replace(
      "- [x] `22222222-2222-2222-2222-222222222222`",
      "- [ ] `22222222-2222-2222-2222-222222222222`"
    );
    const entries = parsePrBody(edited);
    expect(entries.find((e) => e.id.startsWith("2222"))?.checked).toBe(false);
    expect(entries.find((e) => e.id.startsWith("1111"))?.checked).toBe(true);
  });

  it("embeds machine-readable project/base metadata", () => {
    expect(parsePrMeta(body)).toEqual({ project: "demo", base: "main" });
  });

  it("ignores prose the reviewer may add", () => {
    const withProse = body + "\n\nEeven bellen met de klant hierover.\n";
    expect(parsePrBody(withProse)).toHaveLength(2);
  });
});

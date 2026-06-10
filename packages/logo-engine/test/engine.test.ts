import { describe, expect, it } from "vitest";
import {
  MARKS,
  deriveIconSpec,
  generateConcepts,
  getInitials,
  refineHeuristically,
  renderAppIconSvg,
  renderLogoSvg,
  type Brief,
  type LogoSpec,
} from "../src";

const brief: Brief = {
  brandName: "Acme Coffee",
  tagline: "Brewed with care",
  industry: "coffee shop",
  keywords: ["warm", "craft"],
};

describe("generateConcepts", () => {
  it("produces the requested number of valid, diverse specs", () => {
    const specs = generateConcepts(brief, 8, 42);
    expect(specs).toHaveLength(8);
    const layouts = new Set(specs.map((s) => s.layout));
    expect(layouts.size).toBeGreaterThanOrEqual(4);
    for (const spec of specs) {
      expect(spec.brandName).toBe("Acme Coffee");
      expect(spec.palette.primary).toMatch(/^#/);
      expect(spec.nameFont.family.length).toBeGreaterThan(0);
    }
  });

  it("is deterministic for the same seed", () => {
    const a = generateConcepts(brief, 4, 7).map((s) => ({ ...s, id: "x" }));
    const b = generateConcepts(brief, 4, 7).map((s) => ({ ...s, id: "x" }));
    expect(a).toEqual(b);
  });

  it("prefers tag-matched assets", () => {
    const specs = generateConcepts(brief, 8, 1);
    const markIds = specs.map((s) => s.markId).filter((m) => m !== "monogram");
    const coffeeAdjacent = MARKS.filter((m) =>
      m.tags.some((t) => ["coffee", "food", "warm", "craft", "cafe"].includes(t)),
    ).map((m) => m.id);
    expect(markIds.some((id) => coffeeAdjacent.includes(id))).toBe(true);
  });
});

describe("renderLogoSvg", () => {
  const layouts = ["icon-left", "icon-top", "wordmark", "badge", "monogram"] as const;

  it.each(layouts)("renders a valid svg for layout %s", (layout) => {
    const spec: LogoSpec = { ...generateConcepts(brief, 1, 3)[0]!, layout };
    const svg = renderLogoSvg(spec);
    expect(svg).toContain("<svg");
    expect(svg).toContain("</svg>");
    expect(svg).toContain("viewBox");
    expect(svg.toLowerCase()).toContain("acme");
  });

  it("escapes XML in brand names", () => {
    const spec: LogoSpec = { ...generateConcepts(brief, 1, 3)[0]!, brandName: "A&B <Studio>", layout: "wordmark", casing: "title" };
    const svg = renderLogoSvg(spec);
    expect(svg).toContain("&amp;");
    expect(svg).not.toContain("<Studio>");
  });

  it("supports monochrome variants", () => {
    const spec = generateConcepts(brief, 1, 3)[0]!;
    const svg = renderLogoSvg(spec, { monochrome: "#FFFFFF" });
    expect(svg).not.toContain(spec.palette.primary);
  });
});

describe("app icons", () => {
  it("derives an icon spec and renders all shapes", () => {
    const spec = generateConcepts(brief, 1, 9)[0]!;
    const icon = deriveIconSpec(spec);
    expect(icon.monogram).toBe(getInitials("Acme Coffee").toUpperCase());
    for (const shape of ["full", "square", "circle"] as const) {
      const svg = renderAppIconSvg(icon, { shape, size: 256 });
      expect(svg).toContain('width="256"');
      expect(svg).toContain("</svg>");
    }
    const fg = renderAppIconSvg(icon, { foregroundOnly: true });
    expect(fg).not.toContain("linearGradient");
  });
});

describe("refineHeuristically", () => {
  it("applies color instructions", () => {
    const spec = generateConcepts(brief, 1, 5)[0]!;
    const next = refineHeuristically(spec, "make it green");
    expect(next.palette.primary).toBe("#1F9D55");
    expect(next.id).not.toBe(spec.id);
  });

  it("applies style instructions", () => {
    const spec = generateConcepts(brief, 1, 5)[0]!;
    const next = refineHeuristically(spec, "use an outline style and uppercase");
    expect(next.markStyle).toBe("outline");
    expect(next.casing).toBe("upper");
  });
});

describe("getInitials", () => {
  it("handles single and multi word names", () => {
    expect(getInitials("Acme")).toBe("Ac");
    expect(getInitials("Acme Coffee")).toBe("AC");
    expect(getInitials("  ")).toBe("?");
  });
});

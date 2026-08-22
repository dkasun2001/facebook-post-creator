import { describe, expect, it } from "vitest";
import { postColorSchemes, toRgba } from "./colorSchemes";

describe("post color schemes", () => {
  it("provides five distinct curated palettes", () => {
    expect(postColorSchemes).toHaveLength(5);
    expect(new Set(postColorSchemes.map((scheme) => scheme.id)).size).toBe(5);
  });

  it("converts hex colors to canvas-safe rgba values", () => {
    expect(toRgba("#091323", 0.5)).toBe("rgba(9, 19, 35, 0.5)");
  });
});

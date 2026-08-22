import { describe, expect, it } from "vitest";
import { colorsFromScheme, elementColorControls, setElementColor } from "./postElementColors";

describe("post element colors", () => {
  const scheme = { id: "navy" as const, label: "Signal navy", detail: "", ink: "#091323", inkMid: "#243448", accent: "#F6C400", signal: "#E94750", text: "#FFFFFF" };

  it("derives independent color values from a selected scheme", () => {
    expect(colorsFromScheme(scheme)).toMatchObject({ overlay: "#091323", accent: "#F6C400", heart: "#E94750", thumb: "#F6C400" });
  });

  it("updates one element without changing the rest of the artwork palette", () => {
    const colors = colorsFromScheme(scheme);
    expect(setElementColor(colors, "headline", "#FF77AA")).toMatchObject({ headline: "#FF77AA", accent: "#F6C400" });
  });

  it("provides a color control for every independent export and preview layer", () => {
    const colors = colorsFromScheme(scheme);
    expect(elementColorControls.map((control) => control.key)).toEqual(Object.keys(colors));
  });
});

import { describe, expect, it } from "vitest";
import { parsePostPresets } from "./postPresets";

describe("post presets", () => {
  it("retains only valid named template and color combinations", () => {
    const presets = parsePostPresets(JSON.stringify([
      { id: "1", name: "Ruby alert", template: "signal", colorScheme: "ruby" },
      { id: "2", name: "Broken", template: "missing", colorScheme: "ruby" },
    ]));
    expect(presets).toEqual([{ id: "1", name: "Ruby alert", template: "signal", colorScheme: "ruby" }]);
  });

  it("returns an empty list for malformed browser storage", () => {
    expect(parsePostPresets("not-json")).toEqual([]);
  });
});

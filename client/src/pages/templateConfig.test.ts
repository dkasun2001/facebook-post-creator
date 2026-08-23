import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { templateData } from "./templateConfig";

describe("post template configuration", () => {
  it("offers twelve distinct selectable post layouts", () => {
    expect(templateData).toHaveLength(12);
    expect(new Set(templateData.map((template) => template.id)).size).toBe(12);
  });

  it("connects each added viral template to preview and PNG renderer branches", () => {
    const homeSource = readFileSync("client/src/pages/Home.tsx", "utf8");
    ["countdown", "factcheck", "watch", "takeaway"].forEach((template) => {
      expect(homeSource).toContain(`template === "${template}"`);
    });
  });
});

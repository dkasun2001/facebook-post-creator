import { describe, expect, it } from "vitest";
import { templateData } from "./templateConfig";

describe("post template configuration", () => {
  it("offers eight distinct selectable post layouts", () => {
    expect(templateData).toHaveLength(8);
    expect(new Set(templateData.map((template) => template.id)).size).toBe(8);
  });
});

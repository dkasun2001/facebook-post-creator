import { describe, expect, it } from "vitest";
import { hasPostText } from "./postMetadata";

describe("post metadata visibility", () => {
  it("hides blank and whitespace-only metadata values", () => {
    expect(hasPostText("")).toBe(false);
    expect(hasPostText("   ")).toBe(false);
    expect(hasPostText("Soori Daily")).toBe(true);
  });
});

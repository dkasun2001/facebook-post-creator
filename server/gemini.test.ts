import { describe, expect, it } from "vitest";
import { createHeadlinePrompt, createImagePrompt, parseHeadlineOutput } from "./gemini";

describe("Gemini post-generation helpers", () => {
  it("keeps four clean headline values from a JSON response", () => {
    expect(parseHeadlineOutput('{"headlines":["  First angle  ","Second angle","Third angle","Fourth angle"]}')).toEqual([
      "First angle",
      "Second angle",
      "Third angle",
      "Fourth angle",
    ]);
  });

  it("builds a safe editorial-image prompt with no rendered text instruction", () => {
    const prompt = createImagePrompt("A new bridge is opening next week.", "A new route for the city", "english");
    expect(prompt).toContain("Do not render any words");
    expect(prompt).toContain("A new bridge is opening next week.");
  });

  it("requests native Sinhala headlines when Sinhala is selected", () => {
    expect(createHeadlinePrompt("කෙටි පුවතක්", "sinhala")).toContain("natural modern Sinhala");
  });

  it("rejects incomplete Gemini headline payloads", () => {
    expect(() => parseHeadlineOutput('{"headlines":["Only one"]}')).toThrow("four usable headlines");
  });
});

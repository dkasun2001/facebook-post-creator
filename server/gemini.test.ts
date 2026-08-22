import { describe, expect, it } from "vitest";
import { createHeadlinePrompt, createImagePrompt, DEFAULT_HEADLINE_MODELS, parseHeadlineOutput, resolveModelCandidates } from "./gemini";

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

  it("uses a typed model first while retaining the safe defaults as fallbacks", () => {
    expect(resolveModelCandidates("gemini-2.5-pro", DEFAULT_HEADLINE_MODELS)).toEqual([
      "gemini-2.5-pro",
      "gemini-3.7-flash",
      "gemini-2.5-flash",
    ]);
    expect(resolveModelCandidates("", DEFAULT_HEADLINE_MODELS)).toEqual(DEFAULT_HEADLINE_MODELS);
  });
});

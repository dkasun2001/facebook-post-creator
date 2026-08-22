import { describe, expect, it } from "vitest";
import { buildRelevantImagePrompt } from "./imagePrompt";

describe("relevant AI image prompt", () => {
  it("includes the selected news angle, context, output ratio, and safe no-text constraints", () => {
    const prompt = buildRelevantImagePrompt({
      story: "A regional train service is resuming after flood repairs.",
      headline: "Rail services return after repair work",
      language: "english",
      format: "portrait",
    });

    expect(prompt).toContain("Rail services return after repair work");
    expect(prompt).toContain("regional train service");
    expect(prompt).toContain("4:5 vertical composition");
    expect(prompt).toContain("Do not include: any words");
  });

  it("uses a factual fallback when no story is provided", () => {
    const prompt = buildRelevantImagePrompt({ story: "", headline: "A verified update", language: "sinhala", format: "square" });
    expect(prompt).toContain("Sri Lankan Sinhala-language Facebook audience");
    expect(prompt).toContain("1:1 square composition");
    expect(prompt).toContain("avoid inventing details");
  });
});

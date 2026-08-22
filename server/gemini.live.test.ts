import { describe, expect, it } from "vitest";
import { generateGeminiHeadlines } from "./gemini";

describe("Gemini live headline generation", () => {
  it("returns four concise English headline options", async () => {
    const apiKey = process.env.GEMINI_API_KEY;
    expect(apiKey, "GEMINI_API_KEY must be configured for live verification").toBeTruthy();

    const headlines = await generateGeminiHeadlines({
      apiKey: apiKey!,
      language: "english",
      story: "A new electric bus route will connect three towns and is expected to shorten workers’ morning commute next month.",
    });

    expect(headlines).toHaveLength(4);
    expect(headlines.every((headline) => headline.length > 4)).toBe(true);
  }, 90_000);
});

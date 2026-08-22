import { describe, expect, it } from "vitest";

describe("Gemini API credential", () => {
  it("authorizes Google’s model-list endpoint", async () => {
    const apiKey = process.env.GEMINI_API_KEY;
    expect(apiKey, "GEMINI_API_KEY must be configured for live verification").toBeTruthy();

    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models", {
      headers: { "x-goog-api-key": apiKey! },
    });

    expect(response.ok, await response.text()).toBe(true);
  }, 30_000);
});

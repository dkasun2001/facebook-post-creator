import { afterEach, describe, expect, it, vi } from "vitest";
import { requestGeminiHeadlines } from "./geminiHeadlineApi";

const originalFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = originalFetch; });

describe("Gemini headline API client", () => {
  const input = { apiKey: "AIzaSyCONTROLLED_TEST_KEY_123456789", story: "A controlled story that is long enough for a request.", language: "english" as const };

  it("posts to the Vercel JSON endpoint and returns four headlines", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ headlines: ["One", "Two", "Three", "Four"] }), { status: 200, headers: { "content-type": "application/json" } }));
    await expect(requestGeminiHeadlines(input)).resolves.toEqual(["One", "Two", "Three", "Four"]);
    expect(globalThis.fetch).toHaveBeenCalledWith("/api/gemini/headlines", expect.objectContaining({ method: "POST" }));
  });

  it("turns a non-JSON deployment response into a readable editor error", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(new Response("A server error has occurred", { status: 500, headers: { "content-type": "text/plain" } }));
    await expect(requestGeminiHeadlines(input)).rejects.toThrow("unreadable response");
  });
});

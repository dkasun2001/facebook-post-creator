import http from "node:http";
import { afterEach, describe, expect, it, vi } from "vitest";

const generateGeminiHeadlines = vi.hoisted(() => vi.fn());
vi.mock("../../server/gemini", () => ({ generateGeminiHeadlines }));
const { default: handler } = await import("./headlines");

const servers: http.Server[] = [];
afterEach(async () => {
  generateGeminiHeadlines.mockReset();
  await Promise.all(servers.splice(0).map(server => new Promise<void>(resolve => server.close(() => resolve()))));
});

describe("Vercel Gemini headline endpoint", () => {
  it("returns a plain JSON success payload through the production API route", async () => {
    generateGeminiHeadlines.mockResolvedValue(["One", "Two", "Three", "Four"]);
    const server = http.createServer(handler);
    servers.push(server);
    await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("Expected a TCP address.");

    const response = await fetch(`http://127.0.0.1:${address.port}/api/gemini/headlines`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ apiKey: "AIzaSyCONTROLLED_TEST_KEY_123456789", story: "A controlled story that is long enough for headline generation.", language: "english" }),
    });

    expect(response.headers.get("content-type")).toContain("application/json");
    await expect(response.json()).resolves.toEqual({ headlines: ["One", "Two", "Three", "Four"] });
  });
});

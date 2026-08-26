import http from "node:http";
import { afterEach, describe, expect, it, vi } from "vitest";

const generateGeminiHeadlines = vi.hoisted(() => vi.fn());

vi.mock("../gemini", () => ({ generateGeminiHeadlines }));

const { vercelTrpcHandler } = await import("./handler");

const servers: http.Server[] = [];

afterEach(async () => {
  generateGeminiHeadlines.mockReset();
  await Promise.all(servers.splice(0).map(server => new Promise<void>(resolve => server.close(() => resolve()))));
});

describe("portable Vercel Gemini procedure", () => {
  it("returns a successful JSON envelope from the actual function route when headline generation succeeds", async () => {
    generateGeminiHeadlines.mockResolvedValue(["Headline one", "Headline two", "Headline three", "Headline four"]);
    const server = http.createServer(vercelTrpcHandler);
    servers.push(server);
    await new Promise<void>(resolve => server.listen(0, "127.0.0.1", () => resolve()));
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("Expected a TCP test server address.");

    const response = await fetch(`http://127.0.0.1:${address.port}/api/trpc/gemini.generateHeadlines`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ json: { apiKey: "AIzaSyCONTROLLED_TEST_KEY_123456789", story: "A controlled story with enough detail to exercise the portable function.", language: "english" } }),
    });

    expect(response.headers.get("content-type")).toContain("application/json");
    await expect(response.json()).resolves.toEqual({ result: { data: { json: { headlines: ["Headline one", "Headline two", "Headline three", "Headline four"] } } } });
    expect(generateGeminiHeadlines).toHaveBeenCalledWith(expect.objectContaining({ language: "english" }));
  });
});

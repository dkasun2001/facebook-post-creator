import http from "node:http";
import { afterEach, describe, expect, it } from "vitest";
import { vercelTrpcHandler } from "./handler";
import { portableAppRouter } from "./router";

const servers: http.Server[] = [];

afterEach(async () => {
  await Promise.all(servers.splice(0).map(server => new Promise<void>(resolve => server.close(() => resolve()))));
});

describe("portable Vercel router", () => {
  it("exposes an anonymous health endpoint and validates headline input before calling Gemini", async () => {
    const caller = portableAppRouter.createCaller({});
    await expect(caller.health()).resolves.toEqual({ ok: true });
    await expect(caller.gemini.generateHeadlines({ apiKey: "too-short", story: "A long enough story for validation.", language: "english" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("serves a JSON response through the Vercel API path instead of treating the path as a procedure name", async () => {
    const server = http.createServer(vercelTrpcHandler);
    servers.push(server);
    await new Promise<void>(resolve => server.listen(0, "127.0.0.1", () => resolve()));
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("Expected a TCP test server address.");

    const response = await fetch(`http://127.0.0.1:${address.port}/api/trpc/health`);
    expect(response.headers.get("content-type")).toContain("application/json");
    await expect(response.json()).resolves.toEqual({ result: { data: { json: { ok: true } } } });
  });
});

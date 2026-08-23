import { describe, expect, it } from "vitest";
import { portableAppRouter } from "./router";

describe("portable Vercel router", () => {
  it("exposes an anonymous health endpoint and validates headline input before calling Gemini", async () => {
    const caller = portableAppRouter.createCaller({});
    await expect(caller.health()).resolves.toEqual({ ok: true });
    await expect(caller.gemini.generateHeadlines({ apiKey: "too-short", story: "A long enough story for validation.", language: "english" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});

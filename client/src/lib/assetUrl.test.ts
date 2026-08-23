import { describe, expect, it } from "vitest";
import { assetUrl } from "./assetUrl";

describe("portable public asset URLs", () => {
  it("retains the existing local path when no external asset host is configured", () => {
    expect(assetUrl("/manus-storage/logo.png", "")).toBe("/manus-storage/logo.png");
  });

  it("uses a configured Vercel-compatible public asset host without duplicate slashes", () => {
    expect(assetUrl("/manus-storage/logo.png", "https://cdn.example.com/dk-assets/")).toBe("https://cdn.example.com/dk-assets/manus-storage/logo.png");
  });
});

import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const projectRoot = path.resolve(import.meta.dirname, "../..");

describe("Vercel deployment configuration", () => {
  it("keeps the API function outside the SPA rewrite and uses the portable build command", () => {
    const config = JSON.parse(fs.readFileSync(path.join(projectRoot, "vercel.json"), "utf8"));
    const packageJson = JSON.parse(fs.readFileSync(path.join(projectRoot, "package.json"), "utf8"));
    expect(config.outputDirectory).toBe("dist/public");
    expect(config.buildCommand).toBe("pnpm build:vercel");
    expect(config.functions["api/trpc/[trpc].ts"].maxDuration).toBe(60);
    expect(config.rewrites[0]).toEqual({ source: "/((?!api/).*)", destination: "/index.html" });
    expect(packageJson.scripts["build:vercel"]).toContain("VITE_DEPLOY_TARGET=vercel vite build");
  });

  it("documents a public asset base instead of embedding provider credentials", () => {
    const example = fs.readFileSync(path.join(projectRoot, ".env.vercel.example"), "utf8");
    expect(example).toContain("VITE_ASSET_BASE_URL=");
    expect(example).not.toContain("GEMINI_API_KEY=");
  });
});

import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const websiteTitle = "DK Post Studio · Sinhala & English Facebook Posts";

describe("website branding", () => {
  it("keeps the configured application title, document title, and visible header aligned", () => {
    const indexHtml = readFileSync("client/index.html", "utf8");
    const homeSource = readFileSync("client/src/pages/Home.tsx", "utf8");

    expect(process.env.VITE_APP_TITLE?.replace(/\\u0026/g, "&")).toBe(websiteTitle);
    expect(indexHtml).toContain(`<title>${websiteTitle}</title>`);
    expect(homeSource).toContain("DK <span>POST STUDIO</span>");
    expect(homeSource).toContain('useState("DK Daily")');
  });
});

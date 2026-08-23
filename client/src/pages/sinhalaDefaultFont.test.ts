import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("AFSigiri default Sinhala font", () => {
  it("registers AFSigiri for preview and canvas export while retaining uploaded-font precedence", () => {
    const styles = readFileSync("client/src/index.css", "utf8");
    const homeSource = readFileSync("client/src/pages/Home.tsx", "utf8");

    expect(styles).toContain('h2.sinhala-headline { font-family:"AF Sigiri"');
    expect(homeSource).toContain('assetUrl("manus-storage/soori-morning-railway_b9770c94.jpg")');
    expect(styles).toContain('h2.sinhala-headline { font-family:"AF Sigiri"');
    expect(homeSource).toContain('document.fonts.load(\'400 72px "AF Sigiri"\')');
    expect(homeSource).toContain('"AF Sigiri", "Abhaya Libre", "Noto Sans Sinhala", serif');
    expect(homeSource).toContain('customSinhalaFont ? `"${customSinhalaFont.family}", "AF Sigiri"');
  });
});

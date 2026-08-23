import { describe, expect, it, vi } from "vitest";
import { drawViralTemplateCanvas, type ViralTemplateFields } from "./viralTemplateCanvas";

const fields: ViralTemplateFields = {
  countdownNumber: "03",
  countdownLabel: "KEY POINTS",
  factcheckLabel: "FACT CHECK",
  watchLabel: "WATCH NOW",
  takeawayLabel: "WHY IT MATTERS",
};

function createCanvasHarness() {
  const calls: Array<{ method: string; args: unknown[]; color: string }> = [];
  let color = "";
  const context = {
    beginPath: vi.fn(() => calls.push({ method: "beginPath", args: [], color })),
    closePath: vi.fn(() => calls.push({ method: "closePath", args: [], color })),
    fill: vi.fn(() => calls.push({ method: "fill", args: [], color })),
    fillRect: vi.fn((...args: unknown[]) => calls.push({ method: "fillRect", args, color })),
    fillText: vi.fn((...args: unknown[]) => calls.push({ method: "fillText", args, color })),
    lineTo: vi.fn((...args: unknown[]) => calls.push({ method: "lineTo", args, color })),
    moveTo: vi.fn((...args: unknown[]) => calls.push({ method: "moveTo", args, color })),
    set fillStyle(value: string) { color = value; },
    get fillStyle() { return color; },
    font: "",
    textAlign: "left",
  } as unknown as CanvasRenderingContext2D;
  const drawTemplateLabel = vi.fn();
  return { calls, context, drawTemplateLabel };
}

describe("viral template canvas renderers", () => {
  it("draws the editable Countdown number and label in their dedicated colors", () => {
    const harness = createCanvasHarness();
    drawViralTemplateCanvas({ ...harness, template: "countdown", width: 1080, height: 1080, colors: { accent: "#f6c400", headline: "#fff", label: "#e94750", overlay: "#091323" }, fields, toRgba: vi.fn() });
    expect(harness.calls.find((call) => call.method === "fillText")?.args[0]).toBe("03");
    expect(harness.calls.find((call) => call.method === "fillText")?.color).toBe("#f6c400");
    expect(harness.drawTemplateLabel).toHaveBeenCalledWith("KEY POINTS", "#e94750", "#fff", 529.2);
  });

  it("draws each remaining template-specific label and geometric treatment", () => {
    const colors = { accent: "#f6c400", headline: "#fff", label: "#e94750", overlay: "#091323" };
    const factcheck = createCanvasHarness();
    drawViralTemplateCanvas({ ...factcheck, template: "factcheck", width: 1080, height: 1080, colors, fields, toRgba: vi.fn() });
    expect(factcheck.calls.find((call) => call.method === "fillRect")?.color).toBe("#e94750");
    expect(factcheck.drawTemplateLabel).toHaveBeenCalledWith("FACT CHECK", "#e94750", "#fff", 529.2);

    const watch = createCanvasHarness();
    drawViralTemplateCanvas({ ...watch, template: "watch", width: 1080, height: 1080, colors, fields, toRgba: vi.fn() });
    expect(watch.calls.some((call) => call.method === "lineTo")).toBe(true);
    expect(watch.drawTemplateLabel).toHaveBeenCalledWith("WATCH NOW", "#e94750", "#fff", 529.2);

    const takeaway = createCanvasHarness();
    drawViralTemplateCanvas({ ...takeaway, template: "takeaway", width: 1080, height: 1080, colors, fields, toRgba: (value, alpha) => `${value}/${alpha}` });
    expect(takeaway.calls.filter((call) => call.method === "fillRect")).toHaveLength(2);
    expect(takeaway.drawTemplateLabel).toHaveBeenCalledWith("WHY IT MATTERS", "#e94750", "#fff", 556.2);
  });
});

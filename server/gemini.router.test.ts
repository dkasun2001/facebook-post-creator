import { describe, expect, it } from "vitest";
import { geminiErrorMessage } from "./routers";

describe("Gemini user-facing provider errors", () => {
  it("maps image-model quota errors to a clear upgrade/access instruction", () => {
    const message = geminiErrorMessage(new Error("Quota exceeded for model: gemini-3.1-flash-image"));
    expect(message).toContain("no image-generation quota");
    expect(message).toContain("billing-enabled Google AI Studio project");
  });

  it("maps temporary saturation errors to a retry instruction", () => {
    expect(geminiErrorMessage(new Error("Model is currently experiencing high demand"))).toContain("temporarily busy");
  });
});

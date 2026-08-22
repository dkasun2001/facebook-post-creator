import { describe, expect, it, vi } from "vitest";
import { GEMINI_API_KEY_STORAGE_KEY, readGeminiApiKey, writeGeminiApiKey } from "./geminiKeyStorage";

describe("Gemini API key browser storage", () => {
  it("reads a normalized key from browser storage", () => {
    expect(readGeminiApiKey({ getItem: vi.fn().mockReturnValue(" AIza-test ") })).toBe("AIza-test");
  });

  it("stores a key only when present and clears its browser entry when blank", () => {
    const storage = { setItem: vi.fn(), removeItem: vi.fn() };
    writeGeminiApiKey(storage, " AIza-test ");
    expect(storage.setItem).toHaveBeenCalledWith(GEMINI_API_KEY_STORAGE_KEY, "AIza-test");
    writeGeminiApiKey(storage, "   ");
    expect(storage.removeItem).toHaveBeenCalledWith(GEMINI_API_KEY_STORAGE_KEY);
  });
});

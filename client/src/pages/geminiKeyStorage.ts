export const GEMINI_API_KEY_STORAGE_KEY = "soori-gemini-api-key";

export function readGeminiApiKey(storage: Pick<Storage, "getItem">): string {
  return storage.getItem(GEMINI_API_KEY_STORAGE_KEY)?.trim() ?? "";
}

export function writeGeminiApiKey(storage: Pick<Storage, "setItem" | "removeItem">, value: string): void {
  const normalized = value.trim();
  if (normalized) storage.setItem(GEMINI_API_KEY_STORAGE_KEY, normalized);
  else storage.removeItem(GEMINI_API_KEY_STORAGE_KEY);
}

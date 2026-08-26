export type GeminiHeadlineInput = {
  apiKey: string;
  story: string;
  language: "english" | "sinhala";
  model?: string;
};

type GeminiHeadlinePayload = { headlines?: unknown; error?: unknown };

export async function requestGeminiHeadlines(input: GeminiHeadlineInput) {
  const response = await fetch("/api/gemini/headlines", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
  const raw = await response.text();
  let payload: GeminiHeadlinePayload;
  try {
    payload = JSON.parse(raw) as GeminiHeadlinePayload;
  } catch {
    throw new Error("The headline service returned an unreadable response. Refresh the page and try again.");
  }
  if (!response.ok) throw new Error(typeof payload.error === "string" ? payload.error : "Gemini could not generate headlines.");
  if (!Array.isArray(payload.headlines) || payload.headlines.length < 4 || !payload.headlines.every((headline) => typeof headline === "string")) {
    throw new Error("Gemini returned an unexpected headline response. Please try again.");
  }
  return payload.headlines;
}

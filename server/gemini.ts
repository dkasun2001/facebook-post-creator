import { storagePut } from "./storage";

type GenerationLanguage = "english" | "sinhala";
type PostFormat = "square" | "portrait";

type GeminiErrorPayload = {
  error?: { message?: string };
};

type GeminiImagePayload = {
  data?: string;
  mime_type?: string;
};

export const DEFAULT_HEADLINE_MODELS = ["gemini-2.5-flash", "gemini-2.0-flash"];
export const DEFAULT_IMAGE_MODELS = ["gemini-3.1-flash-image", "gemini-2.5-flash-image"];

export function resolveModelCandidates(customModel: string | undefined, defaults: string[]) {
  const model = customModel?.trim();
  if (!model) return defaults;
  return [model, ...defaults.filter((item) => item !== model)];
}

function tidyJson(value: string) {
  return value.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
}

export function parseHeadlineOutput(output: string): string[] {
  const parsed = JSON.parse(tidyJson(output)) as { headlines?: unknown } | unknown[];
  const values = Array.isArray(parsed) ? parsed : parsed.headlines;
  if (!Array.isArray(values)) throw new Error("Gemini returned an unexpected headline format.");

  const headlines = values
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.replace(/^[-•\d.\s]+/, "").trim())
    .filter((item) => item.length > 0)
    .slice(0, 4);

  if (headlines.length < 4) throw new Error("Gemini did not return four usable headlines. Please try again.");
  return headlines;
}

export function createHeadlinePrompt(story: string, language: GenerationLanguage) {
  const requestedLanguage = language === "sinhala" ? "natural modern Sinhala" : "clear international English";
  return `You are a senior social editor creating viral but responsible SEO-aware Facebook image headlines. Read the news description below and return exactly four distinctive, factual headlines in ${requestedLanguage}. Each headline must be concise, mobile-scannable, emotionally specific without clickbait, and usable as large image text. Do not invent facts, statistics, quotes, people, or locations. Avoid emojis and hashtags. Use varied angles: why it matters, key question, human consequence, and what to watch. Return ONLY valid JSON in this exact shape: {"headlines":["headline one","headline two","headline three","headline four"]}.\n\nNEWS DESCRIPTION:\n${story}`;
}

export function createImagePrompt(story: string, headline: string, language: GenerationLanguage) {
  const languageInstruction = language === "sinhala" ? "The story is for a Sinhala-language audience." : "The story is for an English-language audience.";
  return `Create a striking, realistic editorial photo for a social-news post. Base the visual on this news description and headline. Use a cinematic but believable documentary composition, with meaningful subject matter and clean negative space in the lower half for a separate headline overlay. Do not render any words, headlines, logos, watermarks, UI, or readable signage into the image. Avoid misleading depictions, gore, and identifiable public figures unless the story explicitly requires an accurate generic setting. ${languageInstruction}\n\nNEWS DESCRIPTION:\n${story}\n\nSELECTED HEADLINE:\n${headline}`;
}

function readTextOutput(payload: Record<string, any>) {
  if (typeof payload.output_text === "string") return payload.output_text;
  if (typeof payload.output?.text === "string") return payload.output.text;
  const visit = (value: unknown): string | undefined => {
    if (!value || typeof value !== "object") return undefined;
    if (Array.isArray(value)) {
      for (const item of value) {
        const text = visit(item);
        if (text) return text;
      }
      return undefined;
    }
    const record = value as Record<string, unknown>;
    if (typeof record.output_text === "string") return record.output_text;
    if (typeof record.text === "string") return record.text;
    for (const key of ["model_output", "content", "parts", "outputs", "steps", "output"]) {
      const text = visit(record[key]);
      if (text) return text;
    }
    return undefined;
  };
  const output = visit(payload.outputs ?? payload.steps ?? payload.model_output);
  if (output) return output;
  return "";
}

function readImageOutput(payload: Record<string, any>): GeminiImagePayload | undefined {
  if (payload.output_image?.data) return payload.output_image as GeminiImagePayload;
  const visit = (value: unknown): GeminiImagePayload | undefined => {
    if (!value || typeof value !== "object") return undefined;
    if (Array.isArray(value)) {
      for (const item of value) {
        const image = visit(item);
        if (image) return image;
      }
      return undefined;
    }
    const record = value as Record<string, unknown>;
    if (typeof record.data === "string" && typeof record.mime_type === "string" && record.mime_type.startsWith("image/")) {
      return record as GeminiImagePayload;
    }
    for (const key of ["output_image", "image", "model_output", "content", "parts", "outputs", "steps", "output"]) {
      const image = visit(record[key]);
      if (image) return image;
    }
    return undefined;
  };
  return visit(payload.outputs ?? payload.steps ?? payload.model_output);
}

async function geminiInteraction(apiKey: string, body: Record<string, unknown>) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 90_000);
  try {
    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/interactions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({ ...body, store: false }),
      signal: controller.signal,
    });
    const payload = (await response.json().catch(() => ({}))) as Record<string, any> & GeminiErrorPayload;
    if (!response.ok) {
      const message = payload.error?.message || `Gemini request failed (${response.status}).`;
      throw new Error(message);
    }
    return payload;
  } finally {
    clearTimeout(timeout);
  }
}

async function geminiInteractionWithFallback(apiKey: string, models: string[], body: Record<string, unknown>) {
  let lastError: unknown;
  for (const model of models) {
    try {
      return await geminiInteraction(apiKey, { ...body, model });
    } catch (error) {
      lastError = error;
      const message = error instanceof Error ? error.message.toLowerCase() : "";
      const shouldRetry = message.includes("high demand") || message.includes("resource exhausted") || message.includes("429") || message.includes("temporar");
      if (!shouldRetry) throw error;
    }
  }
  throw lastError instanceof Error ? lastError : new Error("Gemini could not complete that request.");
}

export async function generateGeminiHeadlines(input: { apiKey: string; story: string; language: GenerationLanguage; model?: string }) {
  const payload = await geminiInteractionWithFallback(input.apiKey, resolveModelCandidates(input.model, DEFAULT_HEADLINE_MODELS), {
    input: createHeadlinePrompt(input.story, input.language),
  });
  return parseHeadlineOutput(readTextOutput(payload));
}

export async function generateGeminiImage(input: { apiKey: string; story: string; headline: string; language: GenerationLanguage; format: PostFormat; model?: string }) {
  const payload = await geminiInteractionWithFallback(input.apiKey, resolveModelCandidates(input.model, DEFAULT_IMAGE_MODELS), {
    input: [{ type: "text", text: createImagePrompt(input.story, input.headline, input.language) }],
    response_format: {
      type: "image",
      mime_type: "image/jpeg",
      aspect_ratio: input.format === "square" ? "1:1" : "4:5",
      image_size: "1K",
    },
  });

  const image = readImageOutput(payload);
  if (!image?.data) throw new Error("Gemini did not return an image. Please try a more specific news description.");

  const mimeType = image.mime_type === "image/png" ? "image/png" : "image/jpeg";
  const extension = mimeType === "image/png" ? "png" : "jpg";
  const { url } = await storagePut(`generated/gemini-post-${Date.now()}.${extension}`, Buffer.from(image.data, "base64"), mimeType);
  return { url };
}

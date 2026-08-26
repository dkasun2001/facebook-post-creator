import type { IncomingMessage, ServerResponse } from "node:http";
import { generateGeminiHeadlines } from "../../server/gemini";

type RequestWithBody = IncomingMessage & { body?: unknown };

function sendJson(response: ServerResponse, status: number, payload: unknown) {
  response.statusCode = status;
  response.setHeader("content-type", "application/json; charset=utf-8");
  response.end(JSON.stringify(payload));
}

async function readBody(request: RequestWithBody): Promise<unknown> {
  if (request.body !== undefined) return request.body;
  const chunks: Buffer[] = [];
  for await (const chunk of request) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}

function asInput(value: unknown): { apiKey: string; story: string; language: "english" | "sinhala"; model?: string } {
  if (!value || typeof value !== "object") throw new Error("Request body must be a JSON object.");
  const input = value as Record<string, unknown>;
  const apiKey = typeof input.apiKey === "string" ? input.apiKey.trim() : "";
  const story = typeof input.story === "string" ? input.story.trim() : "";
  const language = input.language === "sinhala" ? "sinhala" : input.language === "english" ? "english" : undefined;
  const model = typeof input.model === "string" && input.model.trim() ? input.model.trim() : undefined;

  if (apiKey.length < 20 || apiKey.length > 512) throw new Error("Enter a valid Google Gemini API key.");
  if (story.length < 12 || story.length > 4000) throw new Error("Add between 12 and 4,000 characters of news detail.");
  if (!language) throw new Error("Choose English or Sinhala for the headline language.");
  if (model && (!/^gemini-[a-z0-9.-]+$/i.test(model) || model.length > 120)) throw new Error("Enter a Gemini model ID beginning with gemini-.");
  return { apiKey, story, language, model };
}

function clientMessage(error: unknown) {
  const raw = error instanceof Error ? error.message : "Gemini could not complete that request.";
  const message = raw.toLowerCase();
  if (message.includes("quota") || message.includes("rate limit")) return "This Gemini key has reached its current generation quota. Check usage or billing in Google AI Studio and try again.";
  if (message.includes("high demand") || message.includes("resource exhausted")) return "Gemini is temporarily busy. Please try again in a moment.";
  return raw;
}

/**
 * Lightweight Vercel Node Function. It always serializes a JSON response so a
 * browser never needs to parse Vercel's plain-text invocation error page.
 */
export default async function generateHeadlinesHandler(request: RequestWithBody, response: ServerResponse) {
  if (request.method !== "POST") return sendJson(response, 405, { error: "Method not allowed." });
  try {
    const input = asInput(await readBody(request));
    const headlines = await generateGeminiHeadlines(input);
    return sendJson(response, 200, { headlines });
  } catch (error) {
    return sendJson(response, 400, { error: clientMessage(error) });
  }
}

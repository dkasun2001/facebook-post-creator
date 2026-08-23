import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { z } from "zod";
import { generateGeminiHeadlines } from "../gemini";

const trpc = initTRPC.context<Record<string, never>>().create({ transformer: superjson });
const geminiKeySchema = z.string().trim().min(20).max(512);
const generationLanguageSchema = z.enum(["english", "sinhala"]);
const geminiModelSchema = z.string().trim().regex(/^gemini-[a-z0-9.-]+$/i, "Enter a Gemini model ID beginning with gemini-").max(120).optional();

function portableGeminiError(error: unknown) {
  const rawMessage = error instanceof Error ? error.message : "Gemini could not complete that request.";
  const message = rawMessage.toLowerCase();
  if (message.includes("quota") || message.includes("rate limit")) {
    return "This Gemini key has reached its current generation quota. Check usage or billing in Google AI Studio and try again.";
  }
  if (message.includes("high demand") || message.includes("resource exhausted")) return "Gemini is temporarily busy. Please try again in a moment.";
  return rawMessage;
}

/**
 * Minimal anonymous API surface used by the portable Vercel deployment.
 * Gemini keys arrive only with the current headline request and are never persisted.
 */
export const portableAppRouter = trpc.router({
  health: trpc.procedure.query(() => ({ ok: true })),
  gemini: trpc.router({
    generateHeadlines: trpc.procedure
      .input(z.object({ apiKey: geminiKeySchema, story: z.string().trim().min(12).max(4000), language: generationLanguageSchema, model: geminiModelSchema }))
      .mutation(async ({ input }) => {
        try {
          return { headlines: await generateGeminiHeadlines(input) };
        } catch (error) {
          throw new TRPCError({ code: "BAD_REQUEST", message: portableGeminiError(error) });
        }
      }),
  }),
});

export type PortableAppRouter = typeof portableAppRouter;

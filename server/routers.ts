import { COOKIE_NAME } from "@shared/const";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { generateGeminiHeadlines, generateGeminiImage } from "./gemini";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";

const geminiKeySchema = z.string().trim().min(20).max(512);
const generationLanguageSchema = z.enum(["english", "sinhala"]);

export function geminiErrorMessage(error: unknown) {
  const rawMessage = error instanceof Error ? error.message : "Gemini could not complete that request.";
  const message = rawMessage.toLowerCase();
  if (message.includes("quota") || message.includes("rate limit")) {
    const imageQuota = message.includes("image");
    return imageQuota ? "This Gemini key has no image-generation quota right now. Use a billing-enabled Google AI Studio project or a key with image-model access." : "This Gemini key has reached its current generation quota. Check usage or billing in Google AI Studio and try again.";
  }
  if (message.includes("high demand") || message.includes("resource exhausted")) {
    return "Gemini is temporarily busy. Please try again in a moment.";
  }
  return rawMessage;
}

function toGeminiError(error: unknown) {
  return new TRPCError({ code: "BAD_REQUEST", message: geminiErrorMessage(error) });
}

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),
  gemini: router({
    generateHeadlines: publicProcedure
      .input(z.object({ apiKey: geminiKeySchema, story: z.string().trim().min(12).max(4000), language: generationLanguageSchema }))
      .mutation(async ({ input }) => {
        try {
          const headlines = await generateGeminiHeadlines(input);
          return { headlines };
        } catch (error) {
          throw toGeminiError(error);
        }
      }),
    generateImage: publicProcedure
      .input(z.object({ apiKey: geminiKeySchema, story: z.string().trim().min(12).max(4000), headline: z.string().trim().min(4).max(300), language: generationLanguageSchema, format: z.enum(["square", "portrait"]) }))
      .mutation(async ({ input }) => {
        try {
          return await generateGeminiImage(input);
        } catch (error) {
          throw toGeminiError(error);
        }
      }),
  }),

  // TODO: add feature routers here, e.g.
  // todo: router({
  //   list: protectedProcedure.query(({ ctx }) =>
  //     db.getUserTodos(ctx.user.id)
  //   ),
  // }),
});

export type AppRouter = typeof appRouter;

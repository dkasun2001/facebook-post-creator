# Vercel portability verification

- `pnpm verify:vercel` completed TypeScript validation, 32 passing tests, and the `VITE_DEPLOY_TARGET=vercel vite build` output to `dist/public`.
- The portable router test validated the anonymous health query and rejected invalid Gemini input before any external request.
- The Vercel configuration test verified that `/api/trpc/[trpc].ts` stays outside the SPA rewrite and uses the `build:vercel` command.
- The managed preview was reopened after the portability work. The title, DK Post Studio interface, native template controls, images, and existing local Gemini-key interface continued to render.
- A Vercel account was not connected in this workspace, so no external preview deployment was submitted. The project now includes the configuration and guide needed for the repository import flow.

## Gemini JSON-route correction

The deployed Vercel Function is invoked under `/api/trpc/<procedure>`, while tRPC initially parsed the whole request path as a procedure name. The portable handler now declares `/api/trpc/` as its base path. A real local HTTP integration test calls `/api/trpc/health` and asserts an `application/json` result, preventing this route mismatch from returning a plain-text server error. The active editor endpoint was also queried with a deliberately invalid placeholder key; it returned HTTP 400 with `application/json` and valid JSON content rather than an `Unexpected token` parsing error.

For a non-sensitive success-path browser check, the editor's headline request was intercepted with the same tRPC JSON envelope that the portable API returns. The UI rendered all four controlled headline options and expanded the headline section. The temporary test story and key were restored afterward, and no user-owned key was sent or inspected.

The portable function itself now also has a successful-route integration test. It stubs `generateGeminiHeadlines`, sends a POST to `/api/trpc/gemini.generateHeadlines`, and verifies that the actual Vercel handler returns the expected `application/json` tRPC success envelope with all four headline options.

## Live deployment diagnosis and direct endpoint replacement

The live `facebook-post-creator.vercel.app` deployment was queried directly. Both `/api/trpc/health` and `/api/trpc/gemini.generateHeadlines` returned HTTP 500, `text/plain`, and Vercel's `FUNCTION_INVOCATION_FAILED` page before any procedure code ran. To remove the failing tRPC Function from the creator flow, headline generation now uses the lightweight `POST /api/gemini/headlines` Node Function and a plain JSON client. The client also converts any future non-JSON platform response into a readable message rather than exposing an `Unexpected token` error. The same direct endpoint was mounted in the managed Express runtime and verified in the browser with a deliberately invalid placeholder key: it returned HTTP 400 with valid JSON.

# Deploying DK Post Studio on Vercel

DK Post Studio is prepared as a **public, browser-local editor** for Vercel. The editor preserves the user-entered Gemini key in their browser only and sends it to the same-origin headline endpoint solely for the active request. The portable API deliberately does not use Manus OAuth, the Manus database, Manus Forge storage, or server-side Gemini-key persistence.

> The Vercel function exposes only `gemini.generateHeadlines` and a health query. It is intentionally anonymous because the current product does not have account-bound server data.

| Area | Vercel-ready behavior | Action before first deployment |
|---|---|---|
| Frontend | Vite build output is emitted to `dist/public`. | Use `pnpm build:vercel`. |
| API | `api/gemini/headlines.ts` is a Node Function at `/api/gemini/headlines`. | The editor calls this same-origin JSON endpoint directly. |
| Authentication | Public editor mode; Manus OAuth is not invoked. | Add a separate provider only if user accounts or saved cloud data are required. |
| Gemini | The creator supplies a key per browser; the function does not persist it. | Do **not** add a shared Gemini key unless you also add usage limits and abuse controls. |
| Assets | Logo, built-in images, and AFSigiri load from `VITE_ASSET_BASE_URL`. | Upload the four listed assets to a public host and set the variable. |

## Deployment steps

First, push this checkpoint to the connected GitHub repository. In Vercel, create a project from that repository, select **pnpm**, and retain the repository’s `vercel.json`. The configuration runs `pnpm build:vercel`, serves `dist/public`, reserves `/api/*` for the Node Function, and rewrites all other paths to the Vite SPA entry point. Vercel documents this SPA rewrite pattern for Vite applications and supports TypeScript files in the `/api` directory as Node Functions. [1] [2]

Next, choose a public asset host. Upload the four files named in `.env.vercel.example` while preserving their `manus-storage/` prefix, then set `VITE_ASSET_BASE_URL` in Vercel for **Production**, **Preview**, and **Development**. This is a public build-time variable, so it must contain only the public asset base URL—not a token. Vite exposes environment values to the browser only when prefixed with `VITE_`. [1]

Finally, deploy a preview first. Confirm the home page loads, the AFSigiri Sinhala heading appears, the two built-in images load, and the **Generate 4 headlines** flow succeeds with a creator-provided Gemini key. Vercel preview deployments are the recommended place to validate rewrites before production. [3]

## What is deliberately not migrated

The existing Manus database tables, Manus OAuth callback, session cookie, storage proxy, and built-in analytics script are not used by the Vercel route. The current editor is therefore functional without a database or an authentication provider. If you later add cloud-saved presets, user accounts, or shared workspaces, introduce an external authentication provider and a portable database before making those features available.

## Local checks

Run the following before pushing a deployment branch:

```bash
pnpm verify:vercel
```

This runs type checking, all unit tests, and the Vercel-specific Vite build. Vercel detects `pnpm-lock.yaml` and uses pnpm for dependency installation. [2]

## References

[1] [Vite on Vercel](https://vercel.com/docs/frameworks/frontend/vite)

[2] [Using the Node.js Runtime with Vercel Functions](https://vercel.com/docs/functions/runtimes/node-js)

[3] [Rewrites on Vercel](https://vercel.com/docs/routing/rewrites)

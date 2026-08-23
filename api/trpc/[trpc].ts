import { createHTTPHandler } from "@trpc/server/adapters/standalone";
import { portableAppRouter } from "../../server/vercel/router";

/** Vercel Node Function entrypoint for same-origin tRPC requests from the Vite client. */
export default createHTTPHandler({
  router: portableAppRouter,
  createContext: () => ({}),
});

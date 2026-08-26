import { createHTTPHandler } from "@trpc/server/adapters/standalone";
import { portableAppRouter } from "./router";

/**
 * Vercel invokes this function at `/api/trpc/<procedure>`. The explicit base
 * path prevents tRPC from treating `api/trpc` as part of the procedure name.
 */
export const vercelTrpcBasePath = "/api/trpc/";

export const vercelTrpcHandler = createHTTPHandler({
  router: portableAppRouter,
  createContext: () => ({}),
  basePath: vercelTrpcBasePath,
});

import { vercelTrpcHandler } from "../../server/vercel/handler";

/** Vercel Node Function entrypoint for same-origin tRPC requests from the Vite client. */
export default vercelTrpcHandler;

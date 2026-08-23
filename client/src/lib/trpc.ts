import { createTRPCReact } from "@trpc/react-query";
import type { PortableAppRouter } from "../../../server/vercel/router";

export const trpc = createTRPCReact<PortableAppRouter>();

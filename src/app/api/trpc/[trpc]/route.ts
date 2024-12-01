import { appRouter } from "~/server";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { getServerSession } from "next-auth";
import { authOptions } from "~/app/api/auth/[...nextauth]/handler"
import { type Context } from "~/server/trpc";

const createContext = async (req: Request): Promise<Context> => {
  // Extract cookies from the request
  const session = await getServerSession(authOptions);

  console.log("Session in createContext:", session); // Debugging log

  return {
    session,
  };
};

const handler = async (req: Request) => {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    router: appRouter,
    req,
    createContext: async () => await createContext(req),
  });
};

export { handler as GET, handler as POST };

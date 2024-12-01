import { getSession } from 'next-auth/react';
import { initTRPC } from '@trpc/server';
import { type NextApiRequest } from 'next';

// Define the createContext function with the correct type for 
export const createContext = async ({ req }: { req: NextApiRequest }) => {
  const session = await getSession({ req });
  console.log('Session in createContext:', session); 
  
  return { session };
};

export type Context = ReturnType<typeof createContext> extends Promise<infer T> ? T : never;

// Initialize TRPC with the context type
const trpc = initTRPC.context<Context>().create();


export const router = trpc.router;
export const procedure = trpc.procedure;

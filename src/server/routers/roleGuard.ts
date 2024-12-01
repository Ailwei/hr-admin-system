import { TRPCError } from '@trpc/server';
import { type Context } from '~/server/trpc'

export function roleGuard(roles: string[]) {
  return  ({ ctx }: { ctx: Context }) => {
    if (!ctx.session?.user || !roles.includes(ctx.session.user.role)) {
      console.log("ctx sesion ", ctx.session)
      throw new TRPCError({ code: 'FORBIDDEN', message: 'Access Denied' });
    }
  };
}

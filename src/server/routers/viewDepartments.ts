import { procedure, router } from "../trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "~/server/prisma";



export const getdepartmentRouter = router({
  // Fetch all departments along with manager details
  getDepartments: procedure.query(async ({ ctx }) => {
    
    if (!ctx.session?.user) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "You must be logged in to access this resource.",
      });
    }

    const userRole = ctx.session.user.role;

    if (!["HR-ADMIN", "MANAGER", "EMPLOYEE"].includes(userRole)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Access Denied.",
      });
    }

    try {
      if (userRole === "EMPLOYEE") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Employees cannot view all departments.",
        });
      }

      if (userRole === "MANAGER") {
        
        return await db.department.findMany({
          where: {
            managerId: ctx.session.user.id,
          },
          include: {
            manager: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        });
      }

      if (userRole === "HR-ADMIN") {
        return await db.department.findMany({
          include: {
            manager: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        });
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Error retrieving departments: ${error.message}`,
        });
      }
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "An unknown error occurred while retrieving departments.",
      });
    }
  }),

  // Update department status
  updateDepartmentStatus: procedure
    .input(
      z.object({
        id: z.number(),
        status: z.enum(["Active", "Inactive"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Ensure session exists
      if (!ctx.session?.user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in to perform this action.",
        });
      }

      const userRole = ctx.session.user.role;

      if (userRole !== "HR-ADMIN") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only HR Admins can update department status.",
        });
      }

      try {
        return await db.department.update({
          where: { id: input.id },
          data: { status: input.status },
        });
      } catch (error: unknown) {
        if (error instanceof Error) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Error updating department status: ${error.message}`,
          });
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "An unknown error occurred while updating the department status.",
        });
      }
    }),
});

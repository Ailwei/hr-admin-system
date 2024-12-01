import { procedure, router } from "../trpc";
import { z } from "zod";
import { db } from "~/server/prisma";
import { TRPCError } from "@trpc/server";
import { roleGuard } from "~/server/routers/roleGuard"

export const departmentRouter = router({
  createDepartment: procedure
  .input(
    z.object({
      name: z.string().min(2, "Department name is required"),
      status: z.string().min(1, "Status is required"),
      managerId: z.number(),
    })
  )
  .mutation(async ({ input, ctx }) => {
    const { name, status, managerId } = input;

    // Restrict to HR-ADMIN only
    roleGuard(["HR-ADMIN"])({ ctx });

    // Ensure the manager exists in the employee table
    const manager = await db.employee.findUnique({
      where: { id: managerId },
    });

    if (!manager) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Manager does not exist",
      });
    }

    // Create the department and link the manager
    const department = await db.department.create({
      data: {
        name,
        status,
        managerId,
        departmentEmployees: {
          create: {
            employeeId: managerId, 
          },
        },
      },
    });

    return {
      message: "Department created successfully",
      department,
    };
  }),
  updateDepartment: procedure
  .input(
    z.object({
      id: z.number(),
      name: z.string().min(2, "Department name is required"),
      status: z.string().min(1, "Status is required"),
      managerId: z.number(),
    })
  )
  .mutation(async ({ input, ctx }) => {
    const { id, name, status, managerId } = input;

    // Restrict to HR-ADMIN only
    roleGuard(["HR-ADMIN"])({ ctx });

    // Ensure the department exists
    const department = await db.department.findUnique({
      where: { id },
    });

    if (!department) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Department not found",
      });
    }

    // Ensure the manager exists in the employee table
    const manager = await db.employee.findUnique({
      where: { id: managerId },
    });

    if (!manager) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Manager does not exist",
      });
    }

    // Update the department and maintain the manager's link
    const updatedDepartment = await db.department.update({
      where: { id },
      data: {
        name,
        status,
        managerId,
        departmentEmployees: {
          upsert: {
            where: { employeeId_departmentId: { employeeId: managerId, departmentId: id } },
            update: {},
            create: { employeeId: managerId },
          },
        },
      },
    });

    return {
      message: "Department updated successfully",
      department: updatedDepartment,
    };
  }),
})
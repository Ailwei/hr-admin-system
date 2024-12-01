import { procedure, router } from "../trpc";
import { db } from "~/server/prisma";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { roleGuard } from "~/server/routers/roleGuard";
import EmployeeList from "~/components/EmployeeList";

export const getEmployeesRouter = router({
  // Get all employees based on role
  getEmployees: procedure.query(async ({ ctx }) => {
    const role = ctx.session?.user.role;
    const userId = ctx.session?.user.id;

    if (!role) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: "User not authenticated." });
    }

    // Apply the role guard to check if the user has the correct role
    roleGuard(["EMPLOYEE", "MANAGER", "HR-ADMIN"])( { ctx });

    if (role === "EMPLOYEE") {
      const employee = await db.employee.findUnique({
        where: { userId },
        include: {
          user: true,
          departmentEmployees: { include: { department: true } },
          manager: true,
          subordinates: true,
        },
      });

      return employee ? [employee] : [];
    }

    if (role === "MANAGER") {
      const departments = await db.departmentEmployee.findMany({
        where: { employeeId: userId },
        select: { departmentId: true },
      });

      const employees = await db.employee.findMany({
        where: {
          managerId: userId,
          departmentEmployees: {
            some: {
              departmentId: { in: departments.map((d) => d.departmentId) },
            },
          },
        },
        include: {
          user: true,
          departmentEmployees: { include: { department: true } },
          manager: true,
          subordinates: true,
        },
      });
console.log(ctx)
      return employees;
    }

    if (role === "HR-ADMIN") {
      const employees = await db.employee.findMany({
        include: {
          user: true,
          departmentEmployees: { include: { department: true } },
          manager: true,
          subordinates: true,
        },
      });

      return employees;
    }

    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Access denied.",
    });
  }),

  // Get filtered employees with restrictions
  getFilteredEmployees: procedure
    .input(
      z.object({
        status: z.enum(["Active", "Inactive"]).optional(),
        managerId: z.number().optional(),
        departmentId: z.number().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      const role = ctx.session?.user.role;
      const userId = ctx.session?.user.id;

      if (!role) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "User not authenticated." });
      }

      // Apply the role guard to check if the user has the correct role
      roleGuard(["EMPLOYEE", "MANAGER", "HR-ADMIN"])( { ctx });

      if (role === "MANAGER") {
        const departments = await db.departmentEmployee.findMany({
          where: { employeeId: userId },
          select: { departmentId: true },
        });

        input.departmentId = input.departmentId ?? departments[0]?.departmentId;
      }

      if (role === "EMPLOYEE") {
        input.managerId = userId;
      }

      const employees = await db.employee.findMany({
        where: {
          status: input.status ?? undefined,
          managerId: input.managerId ?? undefined,
          departmentEmployees: {
            some: {
              departmentId: input.departmentId ?? undefined,
            },
          },
        },
        include: {
          user: true,
          departmentEmployees: { include: { department: true } },
          manager: true,
          subordinates: true,
        },
      });
console.log('manager',EmployeeList)
      return employees;
    }),

  // Update employee status (restricted to HRAdmin)
  updateStatus: procedure
    .input(
      z.object({
        employeeId: z.number().min(1, "Employee ID is required"),
        status: z.enum(["Active", "Inactive"]),
      })
    )
    .mutation(async ({ input, ctx }) => {

      // Apply the role guard to ensure only HR-ADMIN can update status
      roleGuard(["HR-ADMIN"])( { ctx });

      const { employeeId, status } = input;

      const employee = await db.employee.findUnique({
        where: { id: employeeId },
      });

      if (!employee) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Employee not found." });
      }

      const updatedEmployee = await db.employee.update({
        where: { id: employeeId },
        data: { status },
      });

      return {
        message: "Employee status updated successfully.",
        employee: updatedEmployee,
      };
    }),

  // Update employee details with role-based restrictions
  updateEmployee: procedure
    .input(
      z.object({
        id: z.number(),
        firstName: z.string(),
        lastName: z.string(),
        email: z.string().email(),
        telephone: z.string(),
        status: z.enum(["Active", "Inactive"]),
        managerId: z.number().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { id, firstName, lastName, email, telephone, status, managerId } = input;
      const role = ctx.session?.user.role;
      const userId = ctx.session?.user.id;

      if (!role) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "User not authenticated." });
      }

      // Apply the role guard to check if the user has the correct role
      roleGuard(["EMPLOYEE", "MANAGER", "HR-ADMIN"])( { ctx });

      // Employees can only edit their own data
      if (role === "EMPLOYEE" && userId !== id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Employees can only edit their own data.",
        });
      }

      // Managers can only edit their subordinates
      if (role === "MANAGER") {
        const employee = await db.employee.findUnique({
          where: { id },
        });

        if (employee?.managerId !== userId) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Managers can only edit their subordinates.",
          });
        }
      }

      // HR Admins can edit anyone
      const updatedEmployee = await db.employee.update({
        where: { id },
        data: {
          firstName,
          lastName,
          telephone,
          email,
          status,
          manager: managerId ? { connect: { id: managerId } } : undefined,
          user: {
            update: {
              email,
            },
          },
        },
        include: {
          user: true,
          manager: {
            select: { firstName: true, lastName: true },
          },
        },
      });

      return {
        message: "Employee updated successfully.",
        employee: updatedEmployee,
      };
    }),
});

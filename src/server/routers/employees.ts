import { procedure, router } from "../trpc";
import { z } from "zod";
import { db } from "~/server/prisma";
import argon2 from "argon2";
import { TRPCError } from "@trpc/server";
import { roleGuard } from '~/server/routers/roleGuard'


export const employeeRouter = router({
  createEmployee: procedure
    .input(
      z.object({
        firstName: z.string().min(1, "First name is required"),
        lastName: z.string().min(1, "Last name is required"),
        telephone: z.string().min(7, "Telephone number is too short"),
        email: z.string().email("Invalid email address"),
        managerId: z.number().optional(),
        departments: z.array(z.number()).optional(),
        status: z.string().optional().default("ACTIVE"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Restrict to HR-ADMIN only
      roleGuard(['HR-ADMIN'])({ ctx });

      const { firstName, lastName, telephone, email, managerId, departments, status } = input;

      // Check if user already exists
      const existingUser = await db.user.findUnique({ where: { email } });
      if (existingUser) {
        throw new TRPCError({ code: "CONFLICT", message: "A user with this email already exists" });
      }

      // Validate manager ID and ensure manager exists
      if (managerId) {
        const manager = await db.employee.findUnique({ where: { id: managerId } });
        if (!manager) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Manager not found" });
        }
      }

      // Default password for new employees
      const defaultPassword = "Password123#";
      const hashedPassword = await argon2.hash(defaultPassword);

      // Create the user
      const user = await db.user.create({
        data: { email, password: hashedPassword, role: "EMPLOYEE" },
      });

      // Create the employee and link them to the user and manager
      const employee = await db.employee.create({
        data: {
          firstName,
          lastName,
          telephone,
          email,
          status,
          managerId,
          userId: user.id,
          departmentEmployees: {
            create: departments?.map((departmentId) => ({ departmentId })) ?? [],
          },
        },
      });

      if (managerId) {
        await db.employee.update({
          where: { id: managerId },
          data: {
            subordinates: {
              connect: { id: employee.id },
            },
          },
        });
      }

      return { message: "Employee and user created successfully", employee };
    }),
});

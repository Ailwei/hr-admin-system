import { procedure, router } from "../trpc";
import { db } from "~/server/prisma";

export const getManagersRouter = router({
  getManagers: procedure.query(async () => {
    const managers = await db.employee.findMany({
      where: {
        user: { role: "MANAGER" },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        Department: {
          select: {
            id: true,
            name: true,
          },
        },
        subordinates: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return managers.map(manager => ({
      id: manager.id,
      name: `${manager.firstName} ${manager.lastName}`,
      departments: manager.Department,
      subordinatesStatus: manager.subordinates.length === 0 ? "none" : "some", 
      subordinates: manager.subordinates.map(sub => ({
        id: sub.id,
        name: `${sub.firstName} ${sub.lastName}`,
      })),
    }));
  }),
});

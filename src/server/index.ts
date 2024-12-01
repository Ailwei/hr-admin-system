
import { employeeRouter } from "./routers/employees";
import { departmentRouter } from "./routers/departments";
import {getEmployeesRouter } from "./routers/viewEmployeelist";
import {router } from "./trpc"
import { getdepartmentRouter } from "./routers/viewDepartments";
import { getManagersRouter } from "./routers/getManagers";


export const appRouter = router({
   //combining all
   employee: employeeRouter,
   department: departmentRouter,
   employeelist: getEmployeesRouter,
   departmentlists: getdepartmentRouter,
   getManagers: getManagersRouter
   
})
export type appRouter = typeof appRouter

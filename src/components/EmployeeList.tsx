

'use client'

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { FaSearch, FaFilter } from "react-icons/fa";
import { trpc } from "~/server/client";
import CreateEmployeeForm from "~/components/CreateEmployeeForm";
import { useSession } from "next-auth/react";

// Define the schema for form validation
const employeeSchema = z.object({
  search: z.string().optional(),
  status: z.enum(["Active", "Inactive"]).optional(),
  manager: z.string().optional(),
});

// Define the Employee type
type Employee = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  telephone: string;
  status: "Active" | "Inactive";
  manager?: {
    firstName: string;
    lastName: string;
  } | null;
};

const EmployeeList: React.FC = () => {
  const { register, handleSubmit, setValue } = useForm({
    resolver: zodResolver(employeeSchema),
  });

  // State for employees, pagination, search, and filter
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [totalEmployees, setTotalEmployees] = useState(0);
  const [search, setSearch] = useState("");
  const [editingEmployeeId, setEditingEmployeeId] = useState<number | null>(null);
  const [editedEmployee, setEditedEmployee] = useState<Employee | null>(null);
  const { data: session, status: sessionStatus } = useSession();

  // Fetch employees and managers data
  const { data: employees, isLoading } = trpc.employeelist.getEmployees.useQuery();
  const { data: managers } = trpc.getManagers.getManagers.useQuery();
  const { data: departments } = trpc.departmentlists.getDepartments.useQuery();
  const { mutateAsync: updateStatus } = trpc.employeelist.updateStatus.useMutation();

  // Update filtered employees when the employees data changes
  useEffect(() => {
    if (employees) {
      const lowercasedSearch = search.toLowerCase();

      const filtered = employees.filter((employee) => {
        const employeeName = `${employee.firstName} ${employee.lastName}`.toLowerCase();
        const managerName = employee.manager
          ? `${employee.manager.firstName} ${employee.manager.lastName}`.toLowerCase()
          : "";

        if (sessionStatus === "loading") return <div>Loading session...</div>;


        return (
          employeeName.includes(lowercasedSearch) ||
          employee.email.toLowerCase().includes(lowercasedSearch) ||
          managerName.includes(lowercasedSearch)
        );
      });

      setFilteredEmployees(filtered);
      setTotalEmployees(filtered.length);
      setPage(1);
    }
  }, [search, employees, sessionStatus]);

  // Filter employees based on form data (status, manager, search)
  const onSubmit = (data: z.infer<typeof employeeSchema>) => {
    const { status, manager } = data;
    console.log(data)

    const filtered = employees?.filter((employee) => {
      const matchesStatus = status ? employee.status === status : true;
      const matchesManager = manager
        ? `${employee.manager?.firstName} ${employee.manager?.lastName}`.includes(manager)
        : true;
      const matchesSearch = search
        ? `${employee.firstName} ${employee.lastName} ${employee.email}`.toLowerCase().includes(search.toLowerCase())
        : true;

      return matchesStatus && matchesManager && matchesSearch;
    }) ?? [];

    setFilteredEmployees(filtered);
    setTotalEmployees(filtered.length);
    setPage(1);
  };

  // Toggle employee status between active and inactive
  const handleToggleStatus = async (id: number, currentStatus: "Active" | "Inactive") => {
    const newStatus = currentStatus === "Active" ? "Inactive" : "Active";

    try {
      await updateStatus({ employeeId: id, status: newStatus });
      setFilteredEmployees((prev) =>
        prev.map((emp) =>
          emp.id === id ? { ...emp, status: newStatus } : emp
        )
      );
    } catch (error) {
      console.error("Error updating employee status:", error);
    }
  };

  // Start editing an employee
  const startEditing = (employee: Employee) => {
    setEditingEmployeeId(employee.id);
    setEditedEmployee(employee);

    // Pre-populate form with current employee's data
    setValue("firstName", employee.firstName);
    setValue("lastName", employee.lastName);
    setValue("email", employee.email);
    setValue("telephone", employee.telephone);
    setValue("status", employee.status);
    setValue("manager", employee.manager ? `${employee.manager.firstName} ${employee.manager.lastName}` : "");
  };

  // Handle change in perPage
  const handlePerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPerPage(Number(e.target.value));
  };

  // Handle page change
  const handlePaginationChange = (pageNum: number) => {
    setPage(pageNum);
  };

  // Paginate employees
  const paginatedEmployees = filteredEmployees.slice((page - 1) * perPage, page * perPage);

  // Calculate total pages for pagination
  const totalPages = Math.ceil(totalEmployees / perPage);

  return (
    <div className="p            -8 max-w-7xl mx-auto">
      {/* Render CreateEmployeeForm only when editing */}
      {editingEmployeeId ? (
        <CreateEmployeeForm employee={editedEmployee} cancelEdit={() => setEditingEmployeeId(null)} />
      ) : (
        <>
          {/* Filter Form */}
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="mb-6 max-w-3xl mx-auto border-2 border-gray-300 bg-white p-6 rounded-lg space-y-4 w-full ml-auto"
          >
            {/* Status Field */}
            <div className="flex items-center gap-4">
              <label htmlFor="status" className="text-sm font-medium text-gray-700 w-24">
                Status
              </label>
              <select
                id="status"
                {...register("status")}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md"
              >
                <option value="">All Status</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>

            {/* Manager Field */}
            <div className="flex items-center gap-4">
              <label
                htmlFor="manager"
                className="text-sm font-medium text-gray-700 w-24"
              >
                Manager
              </label>
              <select
                id="manager"
                {...register("manager")}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md"
              >
                <option value="">All Managers</option>
                {managers?.map((manager) => (
                  <option key={manager.id} value={`${manager.name}`}>
                    {manager.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Department Field */}
            <div className="flex items-center gap-4">
              <label
                htmlFor="department"
                className="text-sm font-medium text-gray-700 w-24"
              >
                Department
              </label>
              <select
                id="department"
                {...register("department")}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md"
              >
                <option value="">All Departments</option>
                {departments?.map((department) => (
                  <option key={department.id} value={department.name}>
                    {department.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter Button */}
            <div className="flex items-center gap-4">
              <label className="w-24 text-sm font-medium text-gray-700"></label>
              <button
                type="submit"
                className="px-6 py-2 bg-blue-500 text-white rounded-md"
              >
                <FaFilter className="inline-block mr-2" />
                Filter
              </button>
            </div>

          </form>

          {/* Search Input and Show Page Filter */}
          <div className="w-full flex justify-between mb-4 items-center">
            {/* Show per page */}
            <div className="flex items-center">
              <label className="mr-2">Show per page:</label>
              <select
                value={perPage}
                onChange={handlePerPageChange}
                className="px-4 py-2 border border-gray-300 rounded-md"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
              </select>
            </div>

            {/* Search Input with Icon */}
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search employees or managers..."
                className="pl-12 pr-4 py-2 border border-gray-300 rounded-md w-30"
              />
            </div>
          </div>
          {/* Employees Table */}
          {isLoading ? (
            <p>Loading...</p>
          ) : (
            <div className="overflow-x-auto rounded-md shadow-md">
              <table className="min-w-full table-auto text-sm text-left">
                <thead>
                  <tr>
                    <th className="px-4 py-2 bg-gray-200">First Name</th>
                    <th className="px-4 py-2 bg-gray-200">Last Name</th>
                    <th className="px-4 py-2 bg-gray-200">Email</th>
                    <th className="px-4 py-2 bg-gray-200">Telephone</th>
                    <th className="px-4 py-2 bg-gray-200">Manager</th>
                    <th className="px-4 py-2 bg-gray-200">Status</th>
                    <th className="px-4 py-2 bg-gray-200">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedEmployees.map((employee) => (
                    <tr key={employee.id}>
                      <td className="px-4 py-2">{employee.firstName}</td>
                      <td className="px-4 py-2">{employee.lastName}</td>
                      <td className="px-4 py-2">{employee.email}</td>
                      <td className="px-4 py-2">{employee.telephone}</td>
                      <td className="px-4 py-2">{employee.manager?.firstName} {employee.manager?.lastName}</td>
                      <td className="px-4 py-2">{employee.status}</td>
                      <td className="px-4 py-2 space-x-2">
                        <button
                          onClick={() => startEditing(employee)}
                          className="px-4 py-2 text-blue-500 underline bg-transparent border-0 cursor-pointer"
                        >
                          Edit
                        </button>

                        <button
                          onClick={() => handleToggleStatus(employee.id, employee.status)}
                          disabled={session?.user?.role === "MANAGER" || session?.user?.role === "EMPLOYEE"}
                          className={`px-4 py-2 ${employee.status === "Active" ? "text-red-500 underline" : "text-green-500 underline"} 
    bg-transparent border-0 
    ${session?.user?.role === "MANAGER" || session?.user?.role === "EMPLOYEE" ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
                          title={
                            session?.user?.role === "MANAGER" || session?.user?.role === "EMPLOYEE"
                              ? "You cannot change the employee status."
                              : employee.status === "Active"
                                ? "Deactivate the employee"
                                : "Activate the employee"
                          }
                        >
                          {employee.status === "Active" ? "Deactivate" : "Activate"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          <div className="mt-6 flex justify-e items-center ml-auto">
            <div className="flex space-x-2">
              {/* Previous button */}
              <button
                onClick={() => handlePaginationChange(page - 1)}
                disabled={page === 1}
                className="px-4 py-2 bg-gray-300 rounded-md"
              >

                &lt;
              </button>

              {/* Page numbers */}
              {Array.from({ length: 6 }, (_, index) => page + index)
                .filter((pageNumber) => pageNumber <= totalPages)
                .map((pageNumber) => (
                  <button
                    key={pageNumber}
                    onClick={() => handlePaginationChange(pageNumber)}
                    disabled={page === pageNumber}
                    className={`px-4 py-2 rounded-md ${page === pageNumber ? 'border-b-2 border-blue-500' : 'bg-gray-300'}`}
                  >
                    {pageNumber}
                  </button>
                ))}

              {/* Next button */}
              <button
                onClick={() => handlePaginationChange(page + 1)}
                disabled={page === totalPages}
                className="px-4 py-2 bg-gray-300 rounded-md"
              >
                &gt;
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default EmployeeList;

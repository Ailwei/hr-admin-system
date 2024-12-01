import React, { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { trpc } from "~/server/client";
import { FaFilter, FaSearch } from "react-icons/fa";
import CreateDepartmentForm from "~/components/CreateDepartmentForm";
import { useQueryClient } from '@tanstack/react-query';
import { useSession } from "next-auth/react";

// Zod Schema for Department Filters
const departmentFilterSchema = z.object({
  search: z.string().optional(),
  status: z.enum(["Active", "Inactive"]).optional(),
});

const departmentSchema = z.object({
  id: z.number(),
  name: z.string(),
  manager: z.object({ firstName: z.string().optional(), lastName: z.string().optional() }),
  status: z.enum(["Active", "Inactive"]),
});

type Department = z.infer<typeof departmentSchema>;

const DepartmentList: React.FC = () => {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(departmentFilterSchema),
  });

  const [departmentPage, setDepartmentPage] = useState(1);
  const [departmentsPerPage, setDepartmentsPerPage] = useState(5);
  const [filteredDepartments, setFilteredDepartments] = useState<Department[]>([]);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [searchText, setSearchText] = useState<string>("");
  const [editingDepartmentId, setEditingDepartmentId] = useState<number | null>(null);
  const queryClient = useQueryClient();
  const { data: session, status: sessionStatus } = useSession();


  const { data: departments, isLoading: isDepartmentsLoading } = trpc.departmentlists.getDepartments.useQuery();
  const { mutateAsync: updateStatus } = trpc.departmentlists.updateDepartmentStatus.useMutation({
    onSuccess: () => {
      void queryClient.invalidateQueries(['departmentlists.getDepartments']);
    },
  });

  // Update the filtered departments based on search text and status filter
  useEffect(() => {
    if (departments) {
      setFilteredDepartments(departments);
    }
  }, [departments]);

  const handleSearch = (search: string) => {
    setSearchText(search);
    const filteredData = departments?.filter((department) => {
      const matchesName = department.name.toLowerCase().includes(search.toLowerCase());
      const matchesManager =
        department.manager?.firstName?.toLowerCase().includes(search.toLowerCase()) ??
        department.manager?.lastName?.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = !statusFilter || department.status.toLowerCase() === statusFilter.toLowerCase();
      return (matchesName || matchesManager) && matchesStatus;
    });
    setFilteredDepartments(filteredData ?? []);
  };

  const handleFilterClick = (data: z.infer<typeof departmentFilterSchema>) => {
    setStatusFilter(data.status ?? undefined);
    setDepartmentPage(1);
    handleSearch(searchText);
  };

  const handleDepartmentsPerPageChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setDepartmentsPerPage(Number(event.target.value));
    setDepartmentPage(1);
  };

  const handleStatusToggle = async (id: number, currentStatus: string) => {
    const newStatus = currentStatus === "Active" ? "Inactive" : "Active";
    setFilteredDepartments((prev) =>
      prev.map((dept) => (dept.id === id ? { ...dept, status: newStatus } : dept))
    );
    try {
      await updateStatus({ id, status: newStatus });
    } catch (error) {
      console.error("Failed to toggle status:", error);
    }
  };

  const handleEdit = (id: number) => {
    setEditingDepartmentId(id);
  };

  // Use memoization to avoid unnecessary recalculations
  const paginatedDepartments = useMemo(() => {
    return filteredDepartments.slice(
      (departmentPage - 1) * departmentsPerPage,
      departmentPage * departmentsPerPage
    );
  }, [filteredDepartments, departmentPage, departmentsPerPage]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredDepartments.length / departmentsPerPage);

  // Generate page numbers around the current page, showing 5 at a time
  const generatePaginationNumbers = () => {
    const pageNumbers = [];
    const startPage = Math.max(departmentPage - 2, 1);
    const endPage = Math.min(departmentPage + 2, totalPages);

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }
    return pageNumbers;
  };

  const handlePaginationChange = (page: number) => {
    if (page > 0 && page <= totalPages) {
      setDepartmentPage(page);
    }
  };
  if (sessionStatus === "loading") return <div>Loading session...</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {editingDepartmentId ? (
        <CreateDepartmentForm
          department={departments?.find((dept) => dept.id === editingDepartmentId)}
          onClose={() => setEditingDepartmentId(null)}
        />
      ) : (
        <>
          <form
            className="mb-6 max-w-3xl mx-auto border-2 border-gray-300 bg-white p-6 rounded-lg space-y-4 w-full ml-auto"
            onSubmit={handleSubmit(handleFilterClick)}
          >
            <div className="mb-4">
              <div className="flex items-center gap-4">
                <label htmlFor="status" className="text-sm font-medium text-gray-700 w-24">Status</label>
                <select
                  id="status"
                  {...register("status")}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md w-full"
                >
                  <option value="">All Status</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>
            <div className="mt-2">
              <button
                type="submit"
                className="ml-24 px-6 py-2 bg-blue-500 text-white rounded-md"
              >
                <FaFilter className="inline-block mr-2" />
                Filter
              </button>
            </div>
          </form>
          <div className="overflow-x-auto bg-white shadow-sm rounded-lg mb-8">
            <div className="flex justify-between items-center gap-4">
              <div className="flex items-center">
                <label htmlFor="departmentsPerPage" className="mr-2">Show per page:</label>
                <select
                  id="departmentsPerPage"
                  value={departmentsPerPage}
                  onChange={handleDepartmentsPerPageChange}
                  className="px-4 py-2 border border-gray-300 rounded-md"
                >
                  <option value={5}>5 per page</option>
                  <option value={10}>10 per page</option>
                  <option value={15}>15 per page</option>
                </select>
              </div>
              <div className="flex items-center border border-gray-300 rounded-md w-1/20">
                <FaSearch className="text-gray-500 ml-2" />
                <input
                  type="text"
                  placeholder="Search by department or manager"
                  value={searchText}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full px-2 py-2 focus:outline-none"
                />
              </div>
            </div>
            <table className="min-w-full table-auto mt-4">
              <thead>
                <tr className="border-b bg-gray-100">
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Department Name</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Manager</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isDepartmentsLoading ? (
                  <tr>
                    <td colSpan={4} className="text-center py-4 text-gray-500">Loading...</td>
                  </tr>
                ) : filteredDepartments.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-4 text-gray-500">No matches found</td>
                  </tr>
                ) : (
                  paginatedDepartments.map((department) => (
                    <tr key={department.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">{department.name}</td>
                      <td className="px-6 py-4">{department.manager?.firstName} {department.manager?.lastName}</td>
                      <td className="px-6 py-4">{department.status}</td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleEdit(department.id)}
                          className="text-blue-500 hover:underline"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleStatusToggle(department.id, department.status)}
                          disabled={session?.user?.role === "MANAGER" || session?.user?.role === "EMPLOYEE"}
                          className={
                            `ml-4 text-sm ${department.status === "Active" ? "text-red-500 underline" : "text-green-500 underline"
                              
                            } 
    bg-transparent border-0 
    ${session?.user?.role === "MANAGER" || session?.user?.role === "EMPLOYEE" ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
                          title={
                            session?.user?.role === "MANAGER" || session?.user?.role === "EMPLOYEE"
                              ? "You cannot change the department status."
                              : department.status === "Active"
                                ? "Deactivate the department"
                                : "Activate the department"
                          }
                        >
                          {department.status === "Active" ? "Deactivate" : "Activate"}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="mt-6 flex justify-e items-center ml-auto">
            <div className="flex justify-center items-center gap-2">
              <button
                onClick={() => handlePaginationChange(departmentPage - 1)}
                disabled={departmentPage === 1}
                className="px-4 py-2 text-sm text-gray-700 bg-gray-200 rounded-md"
              >
                &lt;
              </button>

              {generatePaginationNumbers().map((pageNumber) => (
                <button
                  key={pageNumber}
                  onClick={() => handlePaginationChange(pageNumber)}
                  className={`px-4 py-2 rounded-md ${pageNumber === departmentPage ? "border-b-2 border-blue-500" : "bg-white-300"}`}
                >
                  {pageNumber}
                </button>
              ))}

              <button
                onClick={() => handlePaginationChange(departmentPage + 1)}
                disabled={departmentPage === totalPages}
                className="px-4 py-2 text-sm text-gray-700 bg-gray-200 rounded-md"
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

export default DepartmentList;

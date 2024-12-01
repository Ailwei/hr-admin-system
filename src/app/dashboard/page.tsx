'use client';

import React, { useState, useEffect } from 'react';
import { FaTachometerAlt, FaUsers, FaPlusCircle, FaList } from 'react-icons/fa';
import CreateDepartmentForm from '~/components/CreateDepartmentForm';
import CreateEmployeeForm from '~/components/CreateEmployeeForm';
import EmployeeList from '~/components/EmployeeList';
import ViewDepartment from '~/components/DepartmentList';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Navbar from '~/components/Navbar';

const sidebarLinks = [
  { label: 'Dashboard', icon: <FaTachometerAlt /> },
  { label: 'Employee List', icon: <FaUsers /> },
  { label: 'Create Employee', icon: <FaPlusCircle /> },
  { label: 'Create Department', icon: <FaPlusCircle /> },
  { label: 'Department List', icon: <FaList /> },
];

const Dashboard: React.FC = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeView, setActiveView] = useState<string>('Dashboard');

  // Debugging session
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
    } else if (status === 'authenticated') {
      console.log('Session Data:', session);
    }
  }, [status, session, router]);

  const renderContent = () => {
    switch (activeView) {
      case 'Employee List':
        return <EmployeeList />;
      case 'Create Employee':
        return <CreateEmployeeForm />;
      case 'Department List':
        return <ViewDepartment />;
      case 'Create Department':
        return <CreateDepartmentForm />;
      default:
        return <div>Welcome to the HR-Admin Dashboard!</div>;
    }
  };

  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  // If unauthenticated, return null to prevent rendering
  if (status === 'unauthenticated') {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col">

      <div className="flex flex-1">
        {/* Sidebar */}
        <div className="w-64 bg-gray-800 text-white p-4">
          <h2 className="text-xl font-bold mb-8">
            Role: {session?.user?.role ?? 'N/A'}
          </h2>
          <ul>
            {sidebarLinks.map((link, index) => {
              // Conditionally render "Create Employee" only for HR Admin users
              if (link.label === 'Create Employee' && session?.user?.role !== 'HR-ADMIN') {
                return null;
              }

              // Conditionally render "Create Department" only for HR Admin users
              if (link.label === 'Create Department' && session?.user?.role !== 'HR-ADMIN') {
                return null; 
              }
              if (link.label === 'Department List' && session?.user?.role == 'EMPLOYEE'){
                return null;
              }

              return (
                <li
                  key={index}
                  onClick={() => setActiveView(link.label)}
                  className="flex items-center py-2 px-4 mb-4 rounded hover:bg-gray-700 cursor-pointer"
                >
                  <span className="mr-4">{link.icon}</span>
                  {link.label}
                </li>
              );
            })}
          </ul>

        </div>

        {/* Main Content Area */}
        <div className="flex-1 p-8 overflow-auto">
          <div className="flex justify-between items-center mb-8">
            <div className="text-2xl font-semibold">{activeView}</div>
          </div>

          {/* Render dynamic content */}
          <div className="space-y-8">{renderContent()}</div>

        </div>
      </div>

      {/* Footer Div with Gap */}
      <div className="mt-8 bg-gray-800 py-4 width-full">
        <footer className="text-center text-gray-500 text-sm">
          &copy; 2024 HR Admin. All rights reserved.
        </footer>
      </div>
    </div>
  );
};

export default Dashboard;

import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';

const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-vh-100 d-flex flex-column bg-light">
      <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      <div className="d-flex flex-grow-1">
        {/* Sidebar */}
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* Backdrop for mobile */}
        {sidebarOpen && (
          <div
            className="modal-backdrop fade show d-lg-none"
            onClick={() => setSidebarOpen(false)}
            style={{ zIndex: 1030 }}
          ></div>
        )}

        {/* Main Content Area */}
        <main className="flex-grow-1 p-3 p-md-4 overflow-auto">
          <div className="container-fluid max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;

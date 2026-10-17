import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import ProtectedRoute from '../components/ProtectedRoute';
import RoleBasedRoute from '../components/RoleBasedRoute';
import DashboardLayout from '../layouts/DashboardLayout';

import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';
import NotFound from '../pages/NotFound';

// Customer Pages
import CustomerDashboard from '../pages/customer/CustomerDashboard';
import MyAccounts from '../pages/customer/MyAccounts';
import AccountDetails from '../pages/customer/AccountDetails';
import DepositPage from '../pages/customer/DepositPage';
import WithdrawalPage from '../pages/customer/WithdrawalPage';
import TransferPage from '../pages/customer/TransferPage';
import TransactionHistory from '../pages/customer/TransactionHistory';
import AccountStatement from '../pages/customer/AccountStatement';
import BeneficiariesPage from '../pages/customer/BeneficiariesPage';
import MyProfile from '../pages/customer/MyProfile';
import NotificationsPage from '../pages/customer/NotificationsPage';

// Admin / Staff Pages
import AdminDashboard from '../pages/admin/AdminDashboard';
import CustomerManagement from '../pages/admin/CustomerManagement';
import CustomerDetailsAdmin from '../pages/admin/CustomerDetailsAdmin';
import AccountManagement from '../pages/admin/AccountManagement';
import TransactionManagement from '../pages/admin/TransactionManagement';
import AuditLogsPage from '../pages/admin/AuditLogsPage';

import { useAuth } from '../context/AuthContext';

const HomeRedirect = () => {
  const { isAuthenticated, isStaff } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (isStaff) return <Navigate to="/admin/dashboard" replace />;
  return <Navigate to="/dashboard" replace />;
};

const AppRoutes = () => {
  return (
    <Routes>
      {/* Root Redirection */}
      <Route path="/" element={<HomeRedirect />} />

      {/* Public Authentication Pages */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Protected Routes (Customer & General) */}
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          {/* Customer views */}
          <Route path="/dashboard" element={<CustomerDashboard />} />
          <Route path="/accounts" element={<MyAccounts />} />
          <Route path="/accounts/:id" element={<AccountDetails />} />
          <Route path="/deposit" element={<DepositPage />} />
          <Route path="/withdrawal" element={<WithdrawalPage />} />
          <Route path="/transfer" element={<TransferPage />} />
          <Route path="/transactions" element={<TransactionHistory />} />
          <Route path="/statement" element={<AccountStatement />} />
          <Route path="/beneficiaries" element={<BeneficiariesPage />} />
          <Route path="/profile" element={<MyProfile />} />
          <Route path="/notifications" element={<NotificationsPage />} />

          {/* Admin / Staff restricted views */}
          <Route element={<RoleBasedRoute allowedRoles={['ADMIN', 'STAFF']} />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/customers" element={<CustomerManagement />} />
            <Route path="/admin/customers/:id" element={<CustomerDetailsAdmin />} />
            <Route path="/admin/accounts" element={<AccountManagement />} />
            <Route path="/admin/transactions" element={<TransactionManagement />} />
            <Route path="/admin/audit-logs" element={<AuditLogsPage />} />
          </Route>
        </Route>
      </Route>

      {/* 404 Fallback */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;

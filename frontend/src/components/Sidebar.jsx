import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';

const Sidebar = ({ isOpen, onClose }) => {
  const { isStaff, isAdmin } = useAuth();
  const { unreadCount } = useNotifications();

  const navItemClass = ({ isActive }) =>
    `nav-link px-3 py-2 rounded-2 mb-1 d-flex align-items-center ${
      isActive ? 'bg-primary text-white fw-bold shadow-sm' : 'text-dark hover-bg-light'
    }`;

  return (
    <div
      className={`sidebar bg-white border-end shadow-sm d-flex flex-column ${
        isOpen ? 'show' : ''
      }`}
      style={{
        width: '260px',
        minHeight: 'calc(100vh - 56px)',
        zIndex: 1040,
      }}
    >
      <div className="p-3 border-bottom d-flex align-items-center justify-content-between d-lg-none">
        <span className="fw-bold text-primary">SmartBank Menu</span>
        <button type="button" className="btn-close" onClick={onClose} aria-label="Close"></button>
      </div>

      <div className="p-3 flex-grow-1 overflow-auto">
        {/* Customer Menu */}
        {!isStaff && (
          <>
            <div className="text-uppercase text-muted small fw-bold px-3 mb-2">My Banking</div>
            <ul className="nav flex-column mb-3">
              <li className="nav-item">
                <NavLink to="/dashboard" className={navItemClass} onClick={onClose}>
                  <i className="bi bi-speedometer2 me-2"></i> Dashboard
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink to="/accounts" className={navItemClass} onClick={onClose}>
                  <i className="bi bi-wallet2 me-2"></i> My Accounts
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink to="/deposit" className={navItemClass} onClick={onClose}>
                  <i className="bi bi-arrow-down-left-circle me-2"></i> Deposit
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink to="/withdrawal" className={navItemClass} onClick={onClose}>
                  <i className="bi bi-arrow-up-right-circle me-2"></i> Withdrawal
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink to="/transfer" className={navItemClass} onClick={onClose}>
                  <i className="bi bi-arrow-left-right me-2"></i> Transfer Funds
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink to="/transactions" className={navItemClass} onClick={onClose}>
                  <i className="bi bi-clock-history me-2"></i> Transactions
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink to="/statement" className={navItemClass} onClick={onClose}>
                  <i className="bi bi-file-earmark-spreadsheet me-2"></i> Statement
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink to="/beneficiaries" className={navItemClass} onClick={onClose}>
                  <i className="bi bi-people me-2"></i> Beneficiaries
                </NavLink>
              </li>
            </ul>

            <div className="text-uppercase text-muted small fw-bold px-3 mb-2">Account</div>
            <ul className="nav flex-column">
              <li className="nav-item">
                <NavLink to="/profile" className={navItemClass} onClick={onClose}>
                  <i className="bi bi-person-circle me-2"></i> Profile
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink to="/notifications" className={navItemClass} onClick={onClose}>
                  <i className="bi bi-bell me-2"></i> Notifications
                  {unreadCount > 0 && (
                    <span className="badge bg-danger rounded-pill ms-auto">{unreadCount}</span>
                  )}
                </NavLink>
              </li>
            </ul>
          </>
        )}

        {/* Staff & Admin Menu */}
        {isStaff && (
          <>
            <div className="text-uppercase text-muted small fw-bold px-3 mb-2">
              {isAdmin ? 'Administration' : 'Staff Operations'}
            </div>
            <ul className="nav flex-column mb-3">
              <li className="nav-item">
                <NavLink to="/admin/dashboard" className={navItemClass} onClick={onClose}>
                  <i className="bi bi-bar-chart-fill me-2"></i> Executive Overview
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink to="/admin/customers" className={navItemClass} onClick={onClose}>
                  <i className="bi bi-person-lines-fill me-2"></i> Customer Directory
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink to="/admin/accounts" className={navItemClass} onClick={onClose}>
                  <i className="bi bi-bank2 me-2"></i> Account Management
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink to="/admin/transactions" className={navItemClass} onClick={onClose}>
                  <i className="bi bi-receipt-cutoff me-2"></i> Global Transactions
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink to="/admin/audit-logs" className={navItemClass} onClick={onClose}>
                  <i className="bi bi-shield-check me-2"></i> Audit Trail
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink to="/notifications" className={navItemClass} onClick={onClose}>
                  <i className="bi bi-bell me-2"></i> Notifications
                  {unreadCount > 0 && (
                    <span className="badge bg-danger rounded-pill ms-auto">{unreadCount}</span>
                  )}
                </NavLink>
              </li>
            </ul>
          </>
        )}
      </div>

      <div className="p-3 border-top bg-light text-center">
        <span className="text-muted small">SmartBank v1.0 &copy; 2026</span>
      </div>
    </div>
  );
};

export default Sidebar;

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';

const Navbar = ({ onToggleSidebar }) => {
  const { user, logout, isStaff, isAdmin } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark sticky-top shadow-sm px-3">
      <div className="container-fluid">
        <button
          className="btn btn-outline-light btn-sm me-3 d-lg-none"
          type="button"
          onClick={onToggleSidebar}
          aria-label="Toggle navigation"
        >
          <i className="bi bi-list fs-5"></i>
        </button>

        <Link className="navbar-brand d-flex align-items-center fw-bold text-white me-auto" to="/dashboard">
          <i className="bi bi-bank fs-4 text-warning me-2"></i>
          <span>SmartBank</span>
          <span className="badge bg-secondary ms-2 small fw-normal">Simulation</span>
        </Link>

        <div className="d-flex align-items-center">
          {/* Notification dropdown */}
          <div className="dropdown me-3 position-relative">
            <button
              className="btn btn-outline-light btn-sm position-relative rounded-circle p-2"
              type="button"
              onClick={() => setShowNotifDropdown(!showNotifDropdown)}
              aria-expanded={showNotifDropdown}
              title="Notifications"
            >
              <i className="bi bi-bell fs-6"></i>
              {unreadCount > 0 && (
                <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {showNotifDropdown && (
              <div
                className="dropdown-menu dropdown-menu-end show shadow-lg mt-2 p-0"
                style={{ width: '320px', maxHeight: '420px', overflowY: 'auto', zIndex: 1050 }}
              >
                <div className="p-3 bg-light border-bottom d-flex justify-content-between align-items-center">
                  <h6 className="mb-0 fw-bold">Notifications ({unreadCount})</h6>
                  {unreadCount > 0 && (
                    <button className="btn btn-link btn-sm p-0 text-decoration-none" onClick={markAllAsRead}>
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="list-group list-group-flush">
                  {notifications.length === 0 ? (
                    <div className="p-3 text-center text-muted small">No notifications yet.</div>
                  ) : (
                    notifications.slice(0, 5).map((n) => (
                      <div
                        key={n.id}
                        className={`list-group-item list-group-item-action p-2 small ${!n.is_read ? 'bg-primary-subtle' : ''}`}
                        onClick={() => !n.is_read && markAsRead(n.id)}
                        style={{ cursor: 'pointer' }}
                      >
                        <div className="d-flex w-100 justify-content-between">
                          <strong className="text-dark">{n.title}</strong>
                          <small className="text-muted">{new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small>
                        </div>
                        <p className="mb-1 text-secondary text-truncate">{n.message}</p>
                      </div>
                    ))
                  )}
                </div>
                <div className="p-2 text-center border-top bg-light">
                  <Link
                    to="/notifications"
                    className="small text-decoration-none fw-semibold"
                    onClick={() => setShowNotifDropdown(false)}
                  >
                    View all notifications &rarr;
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* User profile and logout */}
          <div className="d-flex align-items-center">
            <span className="text-white-50 small me-2 d-none d-md-inline">
              <strong className="text-white">{user?.full_name || user?.username}</strong>
              <span className="badge bg-primary ms-2">{user?.role}</span>
            </span>
            <button className="btn btn-outline-danger btn-sm" onClick={logout} title="Sign Out">
              <i className="bi bi-box-arrow-right me-1"></i>
              <span className="d-none d-sm-inline">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

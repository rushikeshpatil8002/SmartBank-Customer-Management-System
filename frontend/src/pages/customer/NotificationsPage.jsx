import React from 'react';
import { useNotifications } from '../../context/NotificationContext';

const NotificationsPage = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4 pb-2 border-bottom">
        <div>
          <h2 className="fw-bold text-dark mb-1">Notification Center</h2>
          <p className="text-muted small mb-0">System alerts, transaction notices, and account security updates</p>
        </div>
        {unreadCount > 0 && (
          <button className="btn btn-outline-primary btn-sm fw-semibold" onClick={markAllAsRead}>
            <i className="bi bi-check2-all me-1"></i> Mark All as Read
          </button>
        )}
      </div>

      <div className="card shadow-sm border-0 rounded-3">
        <div className="card-body p-0">
          {notifications.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <i className="bi bi-bell-slash fs-1 d-block mb-2 text-secondary"></i>
              <h5 className="fw-bold">No Notifications</h5>
              <p className="small mb-0">You're all caught up! New transactions will post alerts here.</p>
            </div>
          ) : (
            <div className="list-group list-group-flush rounded-3">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className={`list-group-item p-4 d-flex justify-content-between align-items-start ${
                    !n.is_read ? 'bg-primary-subtle bg-opacity-25' : ''
                  }`}
                >
                  <div className="d-flex align-items-start me-3">
                    <div
                      className={`p-2 rounded-circle me-3 ${
                        !n.is_read ? 'bg-primary text-white' : 'bg-light text-secondary'
                      }`}
                    >
                      <i className="bi bi-bell-fill fs-5"></i>
                    </div>
                    <div>
                      <div className="d-flex align-items-center gap-2 mb-1">
                        <h6 className="fw-bold text-dark mb-0">{n.title}</h6>
                        {!n.is_read && <span className="badge bg-primary small">New</span>}
                      </div>
                      <p className="text-secondary mb-1">{n.message}</p>
                      <small className="text-muted">{new Date(n.created_at).toLocaleString()}</small>
                    </div>
                  </div>

                  {!n.is_read && (
                    <button
                      className="btn btn-sm btn-outline-secondary text-nowrap"
                      onClick={() => markAsRead(n.id)}
                    >
                      Mark as read
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage;

import React, { useState, useEffect } from 'react';
import apiClient from '../../api/axios';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import Pagination from '../../components/Pagination';

const AuditLogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [actionFilter, setActionFilter] = useState('');
  const [targetTypeFilter, setTargetTypeFilter] = useState('');
  const [usernameFilter, setUsernameFilter] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiClient.get('/audit/', {
        params: {
          action: actionFilter.trim() || undefined,
          target_type: targetTypeFilter.trim() || undefined,
          username: usernameFilter.trim() || undefined,
        },
      });
      setLogs(res.data);
      setCurrentPage(1);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [actionFilter, targetTypeFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchLogs();
  };

  const totalPages = Math.ceil(logs.length / itemsPerPage);
  const displayedLogs = logs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4 pb-2 border-bottom">
        <div>
          <h2 className="fw-bold text-dark mb-1">Security & Administrative Audit Trail</h2>
          <p className="text-muted small mb-0">Immutable records of all critical security, financial, and administrative actions</p>
        </div>
      </div>

      <ErrorMessage error={error} onDismiss={() => setError(null)} />

      {/* Filter Toolbar */}
      <div className="card shadow-sm border-0 rounded-3 mb-4 bg-white p-3">
        <form onSubmit={handleSearchSubmit} className="row g-2 align-items-center">
          <div className="col-12 col-md-4">
            <input
              type="text"
              className="form-control form-control-sm"
              placeholder="Search by username..."
              value={usernameFilter}
              onChange={(e) => setUsernameFilter(e.target.value)}
            />
          </div>
          <div className="col-6 col-md-3">
            <input
              type="text"
              className="form-control form-control-sm"
              placeholder="Filter by action (e.g. LOGIN, DEPOSIT)..."
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
            />
          </div>
          <div className="col-6 col-md-3">
            <input
              type="text"
              className="form-control form-control-sm"
              placeholder="Target entity (User, BankAccount)..."
              value={targetTypeFilter}
              onChange={(e) => setTargetTypeFilter(e.target.value)}
            />
          </div>
          <div className="col-12 col-md-2 text-md-end">
            <button type="submit" className="btn btn-primary btn-sm me-2">Search</button>
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm"
              onClick={() => {
                setUsernameFilter('');
                setActionFilter('');
                setTargetTypeFilter('');
                fetchLogs();
              }}
            >
              Reset
            </button>
          </div>
        </form>
      </div>

      {/* Audit Log Table */}
      <div className="card shadow-sm border-0 rounded-3">
        {loading ? (
          <LoadingSpinner message="Querying audit records..." />
        ) : (
          <>
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0 font-monospace small">
                <thead className="table-light">
                  <tr>
                    <th className="ps-4">Timestamp (UTC)</th>
                    <th>Actor</th>
                    <th>Action</th>
                    <th>Target Type</th>
                    <th>Target ID</th>
                    <th>IP Address</th>
                    <th className="pe-4">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedLogs.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="text-center py-5 text-muted">
                        No audit records found.
                      </td>
                    </tr>
                  ) : (
                    displayedLogs.map((log) => (
                      <tr key={log.id}>
                        <td className="ps-4 text-muted">{new Date(log.created_at).toISOString().replace('T', ' ').substring(0, 19)}</td>
                        <td>
                          <span className="badge bg-light text-dark border">@{log.username}</span>
                        </td>
                        <td>
                          <span className="badge bg-secondary-subtle text-dark fw-bold">{log.action}</span>
                        </td>
                        <td className="text-secondary">{log.target_type}</td>
                        <td className="text-primary">{log.target_id}</td>
                        <td className="text-muted">{log.ip_address || '127.0.0.1'}</td>
                        <td className="pe-4 text-truncate" style={{ maxWidth: '300px' }} title={JSON.stringify(log.details)}>
                          {JSON.stringify(log.details)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="p-3">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={(page) => setCurrentPage(page)}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AuditLogsPage;

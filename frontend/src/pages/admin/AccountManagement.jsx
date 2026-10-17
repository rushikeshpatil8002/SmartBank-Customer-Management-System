import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import apiClient from '../../api/axios';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import StatusBadge from '../../components/StatusBadge';
import ConfirmationModal from '../../components/ConfirmationModal';

const AccountManagement = () => {
  const [searchParams] = useSearchParams();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  // Status Change Modal State
  const [statusTarget, setStatusTarget] = useState(null);
  const [newStatus, setNewStatus] = useState('FROZEN');
  const [statusLoading, setStatusLoading] = useState(false);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiClient.get('/accounts/', {
        params: {
          search: search.trim() || undefined,
          status: statusFilter || undefined,
          account_type: typeFilter || undefined,
        },
      });
      setAccounts(res.data);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, [statusFilter, typeFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchAccounts();
  };

  const handleStatusChangeConfirm = async () => {
    if (!statusTarget) return;
    try {
      setStatusLoading(true);
      await apiClient.patch(`/accounts/${statusTarget.id}/status/`, {
        status: newStatus,
      });
      setStatusTarget(null);
      fetchAccounts();
    } catch (err) {
      setError(err);
      setStatusTarget(null);
    } finally {
      setStatusLoading(false);
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4 pb-2 border-bottom">
        <div>
          <h2 className="fw-bold text-dark mb-1">Account Management</h2>
          <p className="text-muted small mb-0">Control operational status, investigate balances, and execute compliance freezes</p>
        </div>
      </div>

      <ErrorMessage error={error} onDismiss={() => setError(null)} />

      {/* Filter Toolbar */}
      <div className="card shadow-sm border-0 rounded-3 mb-4 bg-white p-3">
        <form onSubmit={handleSearchSubmit} className="row g-2 align-items-center">
          <div className="col-12 col-md-4">
            <div className="input-group input-group-sm">
              <span className="input-group-text bg-white"><i className="bi bi-search"></i></span>
              <input
                type="text"
                className="form-control"
                placeholder="Search account number, customer name, username..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="col-6 col-md-3">
            <select
              className="form-select form-select-sm"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="FROZEN">FROZEN</option>
              <option value="CLOSED">CLOSED</option>
            </select>
          </div>
          <div className="col-6 col-md-3">
            <select
              className="form-select form-select-sm"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="">All Account Types</option>
              <option value="SAVINGS">Savings Account</option>
              <option value="CURRENT">Current Account</option>
            </select>
          </div>
          <div className="col-12 col-md-2 text-md-end">
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm w-100"
              onClick={() => {
                setSearch('');
                setStatusFilter('');
                setTypeFilter('');
                fetchAccounts();
              }}
            >
              Reset
            </button>
          </div>
        </form>
      </div>

      {/* Account Table */}
      <div className="card shadow-sm border-0 rounded-3">
        {loading ? (
          <LoadingSpinner message="Loading account directory..." />
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th className="ps-4">Account Number</th>
                  <th>Customer Owner</th>
                  <th>Account Type</th>
                  <th>Current Balance</th>
                  <th>Status</th>
                  <th>Created Date</th>
                  <th className="pe-4 text-end">Compliance Actions</th>
                </tr>
              </thead>
              <tbody>
                {accounts.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-5 text-muted">
                      No accounts found matching search criteria.
                    </td>
                  </tr>
                ) : (
                  accounts.map((acc) => (
                    <tr key={acc.id}>
                      <td className="ps-4 font-monospace fw-bold text-primary">{acc.account_number}</td>
                      <td>
                        <div className="fw-semibold text-dark">{acc.customer_name}</div>
                        <small className="text-muted">@{acc.customer_username}</small>
                      </td>
                      <td><StatusBadge status={acc.account_type} /></td>
                      <td className="fw-bold text-dark">${parseFloat(acc.balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                      <td><StatusBadge status={acc.status} /></td>
                      <td className="small text-muted">{new Date(acc.created_at).toLocaleDateString()}</td>
                      <td className="pe-4 text-end">
                        {acc.status === 'ACTIVE' && (
                          <button
                            className="btn btn-outline-warning btn-sm"
                            onClick={() => {
                              setStatusTarget(acc);
                              setNewStatus('FROZEN');
                            }}
                          >
                            <i className="bi bi-snow me-1"></i> Freeze
                          </button>
                        )}
                        {acc.status === 'FROZEN' && (
                          <button
                            className="btn btn-outline-success btn-sm"
                            onClick={() => {
                              setStatusTarget(acc);
                              setNewStatus('ACTIVE');
                            }}
                          >
                            <i className="bi bi-check-circle me-1"></i> Unfreeze
                          </button>
                        )}
                        {acc.status !== 'CLOSED' && (
                          <button
                            className="btn btn-outline-danger btn-sm ms-2"
                            onClick={() => {
                              setStatusTarget(acc);
                              setNewStatus('CLOSED');
                            }}
                          >
                            Close
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!statusTarget}
        title="Confirm Account Status Change"
        message={`Are you sure you want to change status of account ${statusTarget?.account_number} to ${newStatus}?`}
        confirmText={`Change to ${newStatus}`}
        isDanger={newStatus === 'CLOSED' || newStatus === 'FROZEN'}
        loading={statusLoading}
        onConfirm={handleStatusChangeConfirm}
        onCancel={() => setStatusTarget(null)}
      />
    </div>
  );
};

export default AccountManagement;

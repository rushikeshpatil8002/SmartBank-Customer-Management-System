import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../../api/axios';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import ConfirmationModal from '../../components/ConfirmationModal';

const CustomerManagement = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search & Filter
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Add Customer Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCust, setNewCust] = useState({
    username: '',
    password: '',
    email: '',
    full_name: '',
    phone_number: '',
    address: '',
    account_type: 'SAVINGS',
  });
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState(null);

  // Deactivate Modal
  const [deactivateTarget, setDeactivateTarget] = useState(null);
  const [deactivateLoading, setDeactivateLoading] = useState(false);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiClient.get('/customers/', {
        params: {
          search: search.trim() || undefined,
          status: statusFilter || undefined,
        },
      });
      setCustomers(res.data);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchCustomers();
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      setModalLoading(true);
      setModalError(null);
      await apiClient.post('/customers/', newCust);
      setShowAddModal(false);
      setNewCust({
        username: '',
        password: '',
        email: '',
        full_name: '',
        phone_number: '',
        address: '',
        account_type: 'SAVINGS',
      });
      fetchCustomers();
    } catch (err) {
      setModalError(err);
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeactivateConfirm = async () => {
    if (!deactivateTarget) return;
    try {
      setDeactivateLoading(true);
      await apiClient.delete(`/customers/${deactivateTarget.id}/`);
      setDeactivateTarget(null);
      fetchCustomers();
    } catch (err) {
      setError(err);
      setDeactivateTarget(null);
    } finally {
      setDeactivateLoading(false);
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4 pb-2 border-bottom">
        <div>
          <h2 className="fw-bold text-dark mb-1">Customer Directory</h2>
          <p className="text-muted small mb-0">Search, manage profiles, onboard new customers, and supervise active status</p>
        </div>
        <button className="btn btn-primary btn-sm fw-semibold" onClick={() => setShowAddModal(true)}>
          <i className="bi bi-person-plus me-1"></i> Register New Customer
        </button>
      </div>

      <ErrorMessage error={error} onDismiss={() => setError(null)} />

      {/* Filter Toolbar */}
      <div className="card shadow-sm border-0 rounded-3 mb-4 bg-white p-3">
        <form onSubmit={handleSearchSubmit} className="row g-2 align-items-center">
          <div className="col-12 col-md-5">
            <div className="input-group input-group-sm">
              <span className="input-group-text bg-white"><i className="bi bi-search"></i></span>
              <input
                type="text"
                className="form-control"
                placeholder="Search by name, username, email, or phone..."
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
              <option value="active">Active Accounts Only</option>
              <option value="inactive">Deactivated Only</option>
            </select>
          </div>
          <div className="col-6 col-md-2">
            <button type="submit" className="btn btn-secondary btn-sm w-100">
              Apply Filter
            </button>
          </div>
          <div className="col-12 col-md-2 text-md-end">
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm w-100"
              onClick={() => {
                setSearch('');
                setStatusFilter('');
                fetchCustomers();
              }}
            >
              Reset
            </button>
          </div>
        </form>
      </div>

      {/* Customer List */}
      <div className="card shadow-sm border-0 rounded-3">
        {loading ? (
          <LoadingSpinner message="Loading customer directory..." />
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th className="ps-4">Customer Name</th>
                  <th>Username</th>
                  <th>Phone Number</th>
                  <th>Accounts</th>
                  <th>Joined Date</th>
                  <th>Status</th>
                  <th className="pe-4 text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-5 text-muted">
                      No customers found matching the search criteria.
                    </td>
                  </tr>
                ) : (
                  customers.map((c) => (
                    <tr key={c.id}>
                      <td className="ps-4">
                        <div className="fw-bold text-dark">{c.full_name}</div>
                        <small className="text-muted">{c.email || 'No email'}</small>
                      </td>
                      <td className="font-monospace small text-primary">{c.username}</td>
                      <td className="small text-secondary">{c.phone_number}</td>
                      <td>
                        <span className="badge bg-secondary-subtle text-secondary">
                          {c.accounts ? c.accounts.length : 0} Account(s)
                        </span>
                      </td>
                      <td className="small text-muted">{new Date(c.created_at).toLocaleDateString()}</td>
                      <td>
                        {c.is_active ? (
                          <span className="badge bg-success-subtle text-success">Active</span>
                        ) : (
                          <span className="badge bg-danger-subtle text-danger">Deactivated</span>
                        )}
                      </td>
                      <td className="pe-4 text-end">
                        <Link to={`/admin/customers/${c.id}`} className="btn btn-outline-primary btn-sm me-2">
                          View & Edit
                        </Link>
                        {c.is_active && (
                          <button
                            className="btn btn-outline-danger btn-sm"
                            title="Deactivate Customer"
                            onClick={() => setDeactivateTarget(c)}
                          >
                            Deactivate
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

      {/* Add Customer Modal */}
      {showAddModal && (
        <div className="modal show fade d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">Register New Customer</h5>
                <button type="button" className="btn-close" onClick={() => setShowAddModal(false)}></button>
              </div>
              <form onSubmit={handleAddSubmit}>
                <div className="modal-body">
                  <ErrorMessage error={modalError} onDismiss={() => setModalError(null)} />
                  <div className="row g-3">
                    <div className="col-sm-6">
                      <label className="form-label small fw-semibold">Username *</label>
                      <input
                        type="text"
                        className="form-control"
                        value={newCust.username}
                        onChange={(e) => setNewCust({ ...newCust, username: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-sm-6">
                      <label className="form-label small fw-semibold">Initial Password *</label>
                      <input
                        type="password"
                        className="form-control"
                        value={newCust.password}
                        onChange={(e) => setNewCust({ ...newCust, password: e.target.value })}
                        required
                        minLength={8}
                      />
                    </div>
                    <div className="col-sm-6">
                      <label className="form-label small fw-semibold">Full Legal Name *</label>
                      <input
                        type="text"
                        className="form-control"
                        value={newCust.full_name}
                        onChange={(e) => setNewCust({ ...newCust, full_name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-sm-6">
                      <label className="form-label small fw-semibold">Email Address</label>
                      <input
                        type="email"
                        className="form-control"
                        value={newCust.email}
                        onChange={(e) => setNewCust({ ...newCust, email: e.target.value })}
                      />
                    </div>
                    <div className="col-sm-6">
                      <label className="form-label small fw-semibold">Phone Number *</label>
                      <input
                        type="text"
                        className="form-control"
                        value={newCust.phone_number}
                        onChange={(e) => setNewCust({ ...newCust, phone_number: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-sm-6">
                      <label className="form-label small fw-semibold">Account Type</label>
                      <select
                        className="form-select"
                        value={newCust.account_type}
                        onChange={(e) => setNewCust({ ...newCust, account_type: e.target.value })}
                      >
                        <option value="SAVINGS">Savings Account</option>
                        <option value="CURRENT">Current Account</option>
                      </select>
                    </div>
                    <div className="col-12">
                      <label className="form-label small fw-semibold">Address *</label>
                      <input
                        type="text"
                        className="form-control"
                        value={newCust.address}
                        onChange={(e) => setNewCust({ ...newCust, address: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                </div>
                <div className="modal-footer border-0">
                  <button type="button" className="btn btn-light" onClick={() => setShowAddModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={modalLoading}>
                    {modalLoading ? 'Creating Customer...' : 'Create Customer Record'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Deactivate Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!deactivateTarget}
        title="Confirm Customer Deactivation"
        message={`Are you sure you want to deactivate ${deactivateTarget?.full_name}? The customer will not be able to log in, but historical financial records will be preserved.`}
        confirmText="Deactivate Customer"
        isDanger={true}
        loading={deactivateLoading}
        onConfirm={handleDeactivateConfirm}
        onCancel={() => setDeactivateTarget(null)}
      />
    </div>
  );
};

export default CustomerManagement;

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import apiClient from '../../api/axios';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import StatusBadge from '../../components/StatusBadge';

const CustomerDetailsAdmin = () => {
  const { id } = useParams();
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // New Account for Customer
  const [showAddAccountModal, setShowAddAccountModal] = useState(false);
  const [accountType, setAccountType] = useState('CURRENT');
  const [initialDeposit, setInitialDeposit] = useState('0.00');
  const [accLoading, setAccLoading] = useState(false);

  const [formData, setFormData] = useState({
    full_name: '',
    phone_number: '',
    address: '',
    is_active: true,
  });

  const fetchCustomer = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiClient.get(`/customers/${id}/`);
      setCustomer(res.data);
      setFormData({
        full_name: res.data.full_name || '',
        phone_number: res.data.phone_number || '',
        address: res.data.address || '',
        is_active: res.data.is_active,
      });
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomer();
  }, [id]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      const res = await apiClient.patch(`/customers/${id}/`, formData);
      setCustomer(res.data);
      setSuccess('Customer record updated successfully.');
    } catch (err) {
      setError(err);
    } finally {
      setSaving(false);
    }
  };

  const handleCreateAccountForCustomer = async (e) => {
    e.preventDefault();
    try {
      setAccLoading(true);
      await apiClient.post('/accounts/', {
        customer_id: customer.id,
        account_type: accountType,
        initial_deposit: initialDeposit,
      });
      setShowAddAccountModal(false);
      fetchCustomer();
    } catch (err) {
      setError(err);
    } finally {
      setAccLoading(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading customer record..." />;
  if (error) return <ErrorMessage error={error} />;
  if (!customer) return <div className="alert alert-warning">Customer record not found.</div>;

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4 pb-2 border-bottom">
        <div>
          <div className="d-flex align-items-center gap-2 mb-1">
            <h2 className="fw-bold text-dark mb-0">{customer.full_name}</h2>
            {customer.is_active ? (
              <span className="badge bg-success-subtle text-success">Active Customer</span>
            ) : (
              <span className="badge bg-danger-subtle text-danger">Deactivated</span>
            )}
          </div>
          <p className="text-muted small mb-0">Username: <strong className="font-monospace text-primary">{customer.username}</strong> &bull; Member since {new Date(customer.created_at).toLocaleDateString()}</p>
        </div>
        <Link to="/admin/customers" className="btn btn-outline-secondary btn-sm">
          &larr; Back to Directory
        </Link>
      </div>

      <ErrorMessage error={error} onDismiss={() => setError(null)} />
      {success && (
        <div className="alert alert-success alert-dismissible fade show">
          <i className="bi bi-check-circle-fill me-2"></i>{success}
          <button type="button" className="btn-close" onClick={() => setSuccess(null)}></button>
        </div>
      )}

      <div className="row g-4">
        {/* Left Column: Edit Customer Form */}
        <div className="col-12 col-lg-6">
          <div className="card shadow-sm border-0 rounded-3 h-100">
            <div className="card-header bg-white py-3">
              <h5 className="fw-bold text-dark mb-0">Customer Details</h5>
            </div>
            <div className="card-body p-4">
              <form onSubmit={handleUpdate}>
                <div className="mb-3">
                  <label className="form-label small fw-semibold">Full Legal Name</label>
                  <input
                    type="text"
                    name="full_name"
                    className="form-control"
                    value={formData.full_name}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-semibold">Phone Number</label>
                  <input
                    type="text"
                    name="phone_number"
                    className="form-control"
                    value={formData.phone_number}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-semibold">Residential Address</label>
                  <textarea
                    name="address"
                    className="form-control"
                    rows="3"
                    value={formData.address}
                    onChange={handleChange}
                    required
                  ></textarea>
                </div>

                <div className="form-check form-switch mb-4">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id="isActiveSwitch"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleChange}
                  />
                  <label className="form-check-label fw-semibold" htmlFor="isActiveSwitch">
                    Account Active & Login Permitted
                  </label>
                </div>

                <button type="submit" className="btn btn-primary px-4" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Updates'}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Right Column: Customer's Accounts */}
        <div className="col-12 col-lg-6">
          <div className="card shadow-sm border-0 rounded-3 h-100">
            <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center">
              <h5 className="fw-bold text-dark mb-0">Assigned Accounts ({customer.accounts ? customer.accounts.length : 0})</h5>
              <button className="btn btn-outline-primary btn-sm" onClick={() => setShowAddAccountModal(true)}>
                <i className="bi bi-plus-circle me-1"></i> Add Account
              </button>
            </div>
            <div className="card-body p-0">
              <div className="list-group list-group-flush">
                {(!customer.accounts || customer.accounts.length === 0) ? (
                  <div className="p-4 text-center text-muted">No accounts currently associated.</div>
                ) : (
                  customer.accounts.map((acc) => (
                    <div key={acc.id} className="list-group-item p-3 d-flex justify-content-between align-items-center">
                      <div>
                        <div className="font-monospace fw-bold text-dark">{acc.account_number}</div>
                        <div className="d-flex gap-2 mt-1">
                          <StatusBadge status={acc.account_type} />
                          <StatusBadge status={acc.status} />
                        </div>
                      </div>
                      <div className="text-end">
                        <div className="fw-bold text-dark">${parseFloat(acc.balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                        <Link to={`/admin/accounts?search=${acc.account_number}`} className="small text-decoration-none">
                          Manage &rarr;
                        </Link>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Account Modal */}
      {showAddAccountModal && (
        <div className="modal show fade d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">Open Account for {customer.full_name}</h5>
                <button type="button" className="btn-close" onClick={() => setShowAddAccountModal(false)}></button>
              </div>
              <form onSubmit={handleCreateAccountForCustomer}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Account Type</label>
                    <select
                      className="form-select"
                      value={accountType}
                      onChange={(e) => setAccountType(e.target.value)}
                    >
                      <option value="SAVINGS">Savings Account</option>
                      <option value="CURRENT">Current Account</option>
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Initial Balance ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="form-control"
                      value={initialDeposit}
                      onChange={(e) => setInitialDeposit(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="modal-footer border-0">
                  <button type="button" className="btn btn-light" onClick={() => setShowAddAccountModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={accLoading}>
                    {accLoading ? 'Opening...' : 'Create Bank Account'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerDetailsAdmin;

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../../api/axios';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import StatusBadge from '../../components/StatusBadge';

const CustomerDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiClient.get('/dashboard/');
      setData(res.data);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) return <LoadingSpinner message="Loading customer dashboard..." />;
  if (error) return <ErrorMessage error={error} />;

  const accounts = data?.accounts || [];
  const recentTxns = data?.recent_transactions || [];

  return (
    <div>
      {/* Top Banner */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 pb-2 border-bottom">
        <div>
          <h2 className="fw-bold text-dark mb-1">{data?.greeting}</h2>
          <p className="text-muted small mb-0">Overview of your simulated banking balances and recent activity</p>
        </div>
        <div className="mt-3 mt-md-0 d-flex gap-2">
          <Link to="/deposit" className="btn btn-outline-success btn-sm fw-semibold">
            <i className="bi bi-plus-circle me-1"></i> Deposit
          </Link>
          <Link to="/withdrawal" className="btn btn-outline-danger btn-sm fw-semibold">
            <i className="bi bi-dash-circle me-1"></i> Withdraw
          </Link>
          <Link to="/transfer" className="btn btn-primary btn-sm fw-semibold">
            <i className="bi bi-arrow-left-right me-1"></i> Transfer
          </Link>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-md-4">
          <div className="card shadow-sm border-0 rounded-3 bg-primary text-white h-100">
            <div className="card-body p-4">
              <span className="text-white-50 small text-uppercase fw-bold">Total Available Balance</span>
              <h2 className="fw-bold mt-2 mb-1">${parseFloat(data?.total_balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</h2>
              <span className="small text-white-50">USD &bull; Across {accounts.length} Accounts</span>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-4">
          <div className="card shadow-sm border-0 rounded-3 bg-white h-100">
            <div className="card-body p-4">
              <span className="text-muted small text-uppercase fw-bold">Active Accounts</span>
              <h2 className="fw-bold text-dark mt-2 mb-1">{accounts.filter(a => a.status === 'ACTIVE').length}</h2>
              <Link to="/accounts" className="small text-primary text-decoration-none fw-semibold">
                View all accounts &rarr;
              </Link>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-4">
          <div className="card shadow-sm border-0 rounded-3 bg-white h-100">
            <div className="card-body p-4">
              <span className="text-muted small text-uppercase fw-bold">Unread Alerts</span>
              <h2 className="fw-bold text-dark mt-2 mb-1">{data?.unread_notifications_count || 0}</h2>
              <Link to="/notifications" className="small text-primary text-decoration-none fw-semibold">
                Check notification center &rarr;
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Account Cards */}
      <h5 className="fw-bold text-dark mb-3">My Bank Accounts</h5>
      <div className="row g-3 mb-4">
        {accounts.map((acc) => (
          <div key={acc.id} className="col-12 col-md-6">
            <div className="card shadow-sm border-0 rounded-3 h-100">
              <div className="card-body p-4">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span className="badge bg-light text-dark border font-monospace fs-6">{acc.account_number}</span>
                  <StatusBadge status={acc.status} />
                </div>
                <div className="d-flex justify-content-between align-items-baseline mt-3">
                  <div>
                    <span className="text-muted small d-block">{acc.account_type === 'SAVINGS' ? 'Savings Account' : 'Current Account'}</span>
                    <h3 className="fw-bold text-dark mb-0">${parseFloat(acc.balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}</h3>
                  </div>
                  <Link to={`/accounts/${acc.id}`} className="btn btn-outline-primary btn-sm">
                    Manage &rarr;
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity Table */}
      <div className="card shadow-sm border-0 rounded-3">
        <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center">
          <h5 className="fw-bold text-dark mb-0">Recent Transaction History</h5>
          <Link to="/transactions" className="btn btn-sm btn-link text-decoration-none fw-semibold">
            View All &rarr;
          </Link>
        </div>
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th className="ps-4">Reference</th>
                <th>Date</th>
                <th>Type</th>
                <th>Description</th>
                <th>Amount</th>
                <th className="pe-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentTxns.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-4 text-muted">No transactions found.</td>
                </tr>
              ) : (
                recentTxns.map((t) => (
                  <tr key={t.id}>
                    <td className="ps-4 font-monospace text-primary small fw-semibold">{t.transaction_ref}</td>
                    <td className="small text-muted">{new Date(t.created_at).toLocaleDateString()}</td>
                    <td><StatusBadge status={t.transaction_type} /></td>
                    <td className="small text-dark">{t.description}</td>
                    <td className="fw-bold text-dark">${parseFloat(t.amount).toFixed(2)}</td>
                    <td className="pe-4"><StatusBadge status={t.status} /></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CustomerDashboard;

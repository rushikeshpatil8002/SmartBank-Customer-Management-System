import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../../api/axios';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import StatusBadge from '../../components/StatusBadge';

const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
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

    fetchDashboard();
  }, []);

  if (loading) return <LoadingSpinner message="Loading executive dashboard..." />;
  if (error) return <ErrorMessage error={error} />;

  const metrics = data?.metrics || {};
  const recentTxns = data?.recent_transactions || [];

  return (
    <div>
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 pb-2 border-bottom">
        <div>
          <h2 className="fw-bold text-dark mb-1">Executive Management Dashboard</h2>
          <p className="text-muted small mb-0">System-wide simulation overview across accounts, balances, and ledger volume</p>
        </div>
        <div className="mt-3 mt-md-0 d-flex gap-2">
          <Link to="/admin/customers" className="btn btn-outline-primary btn-sm fw-semibold">
            <i className="bi bi-people me-1"></i> Customer Directory
          </Link>
          <Link to="/admin/accounts" className="btn btn-outline-secondary btn-sm fw-semibold">
            <i className="bi bi-bank2 me-1"></i> Account Control
          </Link>
        </div>
      </div>

      {/* Metrics Row 1: Counts */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-lg-3">
          <div className="card shadow-sm border-0 rounded-3 bg-white h-100">
            <div className="card-body p-4">
              <span className="text-muted small text-uppercase fw-bold">Total Customers</span>
              <h2 className="fw-bold text-dark mt-2 mb-0">{metrics.total_customers}</h2>
              <small className="text-primary fw-semibold">Verified User Profiles</small>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-lg-3">
          <div className="card shadow-sm border-0 rounded-3 bg-white h-100">
            <div className="card-body p-4">
              <span className="text-muted small text-uppercase fw-bold">Active Accounts</span>
              <h2 className="fw-bold text-success mt-2 mb-0">{metrics.active_accounts}</h2>
              <small className="text-muted">Total: {metrics.total_accounts} accounts</small>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-lg-3">
          <div className="card shadow-sm border-0 rounded-3 bg-white h-100">
            <div className="card-body p-4">
              <span className="text-muted small text-uppercase fw-bold">Frozen Accounts</span>
              <h2 className="fw-bold text-warning mt-2 mb-0">{metrics.frozen_accounts}</h2>
              <small className="text-muted">Under Compliance Review</small>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-lg-3">
          <div className="card shadow-sm border-0 rounded-3 bg-white h-100">
            <div className="card-body p-4">
              <span className="text-muted small text-uppercase fw-bold">Closed Accounts</span>
              <h2 className="fw-bold text-danger mt-2 mb-0">{metrics.closed_accounts}</h2>
              <small className="text-muted">Terminated</small>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Row 2: Volumes */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-md-4">
          <div className="card shadow-sm border-0 rounded-3 bg-success bg-opacity-10 border-start border-success border-4 h-100">
            <div className="card-body p-4">
              <span className="text-success small text-uppercase fw-bold">Total Simulated Deposits</span>
              <h3 className="fw-bold text-dark mt-2 mb-0">${parseFloat(metrics.total_deposits || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</h3>
              <small className="text-muted">Cumulative inflow</small>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-4">
          <div className="card shadow-sm border-0 rounded-3 bg-danger bg-opacity-10 border-start border-danger border-4 h-100">
            <div className="card-body p-4">
              <span className="text-danger small text-uppercase fw-bold">Total Simulated Withdrawals</span>
              <h3 className="fw-bold text-dark mt-2 mb-0">${parseFloat(metrics.total_withdrawals || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</h3>
              <small className="text-muted">Cumulative outflow</small>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-4">
          <div className="card shadow-sm border-0 rounded-3 bg-primary bg-opacity-10 border-start border-primary border-4 h-100">
            <div className="card-body p-4">
              <span className="text-primary small text-uppercase fw-bold">Total Transfers Volume</span>
              <h3 className="fw-bold text-dark mt-2 mb-0">${parseFloat(metrics.total_transfers || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</h3>
              <small className="text-muted">P2P Internal velocity</small>
            </div>
          </div>
        </div>
      </div>

      {/* System Transactions */}
      <div className="card shadow-sm border-0 rounded-3">
        <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center">
          <h5 className="fw-bold text-dark mb-0">Recent System Transactions</h5>
          <Link to="/admin/transactions" className="btn btn-sm btn-link text-decoration-none fw-semibold">
            All Transactions &rarr;
          </Link>
        </div>
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th className="ps-4">Reference</th>
                <th>Date & Time</th>
                <th>Type</th>
                <th>Source</th>
                <th>Destination</th>
                <th>Amount</th>
                <th className="pe-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentTxns.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-4 text-muted">No transactions recorded.</td>
                </tr>
              ) : (
                recentTxns.map((t) => (
                  <tr key={t.id}>
                    <td className="ps-4 font-monospace text-primary small fw-semibold">{t.transaction_ref}</td>
                    <td className="small text-muted">{new Date(t.created_at).toLocaleString()}</td>
                    <td><StatusBadge status={t.transaction_type} /></td>
                    <td className="small font-monospace">{t.source_account_number || 'CASH / EXTERNAL'}</td>
                    <td className="small font-monospace">{t.destination_account_number || 'CASH / EXTERNAL'}</td>
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

export default AdminDashboard;

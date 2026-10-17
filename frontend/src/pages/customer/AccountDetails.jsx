import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import apiClient from '../../api/axios';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import StatusBadge from '../../components/StatusBadge';

const AccountDetails = () => {
  const { id } = useParams();
  const [account, setAccount] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAccountData = async () => {
      try {
        setLoading(true);
        setError(null);
        const accRes = await apiClient.get(`/accounts/${id}/`);
        setAccount(accRes.data);

        // Fetch transactions for this account
        const txnRes = await apiClient.get(`/transactions/?account_number=${accRes.data.account_number}`);
        setTransactions(txnRes.data);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchAccountData();
  }, [id]);

  if (loading) return <LoadingSpinner message="Loading account details..." />;
  if (error) return <ErrorMessage error={error} />;
  if (!account) return <div className="alert alert-warning">Account not found.</div>;

  return (
    <div>
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 pb-2 border-bottom">
        <div>
          <div className="d-flex align-items-center gap-2 mb-1">
            <h2 className="fw-bold text-dark mb-0 font-monospace">{account.account_number}</h2>
            <StatusBadge status={account.status} />
            <StatusBadge status={account.account_type} />
          </div>
          <p className="text-muted small mb-0">Managed by {account.customer_name} &bull; Opened on {new Date(account.created_at).toLocaleDateString()}</p>
        </div>
        <div className="mt-3 mt-md-0 d-flex gap-2">
          <Link to={`/statement?account=${account.account_number}`} className="btn btn-outline-secondary btn-sm">
            <i className="bi bi-file-earmark-spreadsheet me-1"></i> Statement & CSV
          </Link>
          <Link to={`/deposit?account=${account.account_number}`} className="btn btn-outline-success btn-sm">
            <i className="bi bi-plus-circle me-1"></i> Deposit
          </Link>
          <Link to={`/withdrawal?account=${account.account_number}`} className="btn btn-outline-danger btn-sm">
            <i className="bi bi-dash-circle me-1"></i> Withdraw
          </Link>
        </div>
      </div>

      {/* Balance Summary Card */}
      <div className="card shadow-sm border-0 rounded-3 mb-4 bg-white p-4">
        <div className="row align-items-center">
          <div className="col-sm-6">
            <span className="text-muted small text-uppercase fw-bold">Current Available Balance</span>
            <h1 className="fw-bold text-dark my-2">${parseFloat(account.balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}</h1>
            <span className="badge bg-secondary-subtle text-secondary">{account.currency} - US Dollar</span>
          </div>
          <div className="col-sm-6 text-sm-end mt-3 mt-sm-0">
            <div className="text-muted small">Account Operational Status</div>
            <div className="fw-semibold text-dark">{account.status === 'ACTIVE' ? 'Ready for debits and credits' : 'Frozen / Restricted'}</div>
          </div>
        </div>
      </div>

      {/* Account Transactions */}
      <div className="card shadow-sm border-0 rounded-3">
        <div className="card-header bg-white py-3">
          <h5 className="fw-bold text-dark mb-0">Transactions for this Account</h5>
        </div>
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th className="ps-4">Reference</th>
                <th>Date & Time</th>
                <th>Type</th>
                <th>Debit / Credit</th>
                <th>Amount</th>
                <th className="pe-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-4 text-muted">No transactions on this account yet.</td>
                </tr>
              ) : (
                transactions.map((t) => {
                  const isCredit = t.destination_account_number === account.account_number;
                  return (
                    <tr key={t.id}>
                      <td className="ps-4 font-monospace small text-primary fw-semibold">{t.transaction_ref}</td>
                      <td className="small text-muted">{new Date(t.created_at).toLocaleString()}</td>
                      <td><StatusBadge status={t.transaction_type} /></td>
                      <td>
                        {isCredit ? (
                          <span className="badge bg-success-subtle text-success"><i className="bi bi-plus me-1"></i>Credit</span>
                        ) : (
                          <span className="badge bg-danger-subtle text-danger"><i className="bi bi-dash me-1"></i>Debit</span>
                        )}
                      </td>
                      <td className={`fw-bold ${isCredit ? 'text-success' : 'text-danger'}`}>
                        {isCredit ? '+' : '-'}${parseFloat(t.amount).toFixed(2)}
                      </td>
                      <td className="pe-4"><StatusBadge status={t.status} /></td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AccountDetails;

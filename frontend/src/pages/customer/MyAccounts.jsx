import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../../api/axios';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import StatusBadge from '../../components/StatusBadge';

const MyAccounts = () => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // New Account Modal State
  const [showModal, setShowModal] = useState(false);
  const [newAccountType, setNewAccountType] = useState('CURRENT');
  const [newAccountDeposit, setNewAccountDeposit] = useState('0.00');
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState(null);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiClient.get('/accounts/');
      setAccounts(res.data);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleCreateAccount = async (e) => {
    e.preventDefault();
    try {
      setModalLoading(true);
      setModalError(null);
      await apiClient.post('/accounts/', {
        account_type: newAccountType,
        initial_deposit: newAccountDeposit,
      });
      setShowModal(false);
      fetchAccounts();
    } catch (err) {
      setModalError(err);
    } finally {
      setModalLoading(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading your accounts..." />;

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4 pb-2 border-bottom">
        <div>
          <h2 className="fw-bold text-dark mb-1">My Bank Accounts</h2>
          <p className="text-muted small mb-0">View balances, account numbers, and open additional simulation accounts</p>
        </div>
        <button className="btn btn-primary btn-sm fw-semibold" onClick={() => setShowModal(true)}>
          <i className="bi bi-plus-circle me-1"></i> Open New Account
        </button>
      </div>

      <ErrorMessage error={error} onDismiss={() => setError(null)} />

      <div className="row g-4">
        {accounts.map((acc) => (
          <div key={acc.id} className="col-12 col-md-6 col-lg-4">
            <div className="card shadow-sm border-0 rounded-3 h-100">
              <div className="card-body p-4 d-flex flex-column">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <StatusBadge status={acc.account_type} />
                  <StatusBadge status={acc.status} />
                </div>
                <div className="mb-3">
                  <span className="text-muted small">Account Number</span>
                  <div className="fw-bold fs-5 text-dark font-monospace">{acc.account_number}</div>
                </div>
                <div className="mb-4">
                  <span className="text-muted small">Current Balance</span>
                  <h3 className="fw-bold text-dark mb-0">${parseFloat(acc.balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}</h3>
                  <small className="text-muted">{acc.currency}</small>
                </div>
                <div className="mt-auto pt-3 border-top d-flex gap-2">
                  <Link to={`/accounts/${acc.id}`} className="btn btn-outline-primary btn-sm flex-grow-1">
                    Details
                  </Link>
                  <Link to={`/statement?account=${acc.account_number}`} className="btn btn-outline-secondary btn-sm">
                    Statement
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal for opening an account */}
      {showModal && (
        <div className="modal show fade d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">Open Additional Account</h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <form onSubmit={handleCreateAccount}>
                <div className="modal-body">
                  <ErrorMessage error={modalError} onDismiss={() => setModalError(null)} />
                  <div className="mb-3">
                    <label className="form-label fw-semibold small">Account Type</label>
                    <select
                      className="form-select"
                      value={newAccountType}
                      onChange={(e) => setNewAccountType(e.target.value)}
                    >
                      <option value="SAVINGS">Savings Account</option>
                      <option value="CURRENT">Current Account</option>
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold small">Initial Opening Balance ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="form-control"
                      value={newAccountDeposit}
                      onChange={(e) => setNewAccountDeposit(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="modal-footer border-0">
                  <button type="button" className="btn btn-light" onClick={() => setShowModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={modalLoading}>
                    {modalLoading ? 'Opening...' : 'Confirm & Open'}
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

export default MyAccounts;

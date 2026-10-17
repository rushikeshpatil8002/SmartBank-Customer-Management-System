import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import apiClient from '../../api/axios';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import ConfirmationModal from '../../components/ConfirmationModal';

const DepositPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(searchParams.get('account') || '');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        setLoading(true);
        const res = await apiClient.get('/accounts/');
        const activeAccounts = res.data.filter((a) => a.status === 'ACTIVE');
        setAccounts(activeAccounts);
        if (!selectedAccount && activeAccounts.length > 0) {
          setSelectedAccount(activeAccounts[0].account_number);
        }
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchAccounts();
  }, [selectedAccount]);

  const handleOpenConfirm = (e) => {
    e.preventDefault();
    if (!selectedAccount) {
      setError('Please select an active destination account.');
      return;
    }
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Deposit amount must be greater than $0.00.');
      return;
    }
    setError(null);
    setShowConfirm(true);
  };

  const handleDepositConfirm = async () => {
    try {
      setSubmitting(true);
      setError(null);
      const res = await apiClient.post('/transactions/deposit/', {
        account_number: selectedAccount,
        amount: parseFloat(amount).toFixed(2),
        description: description.trim() || 'Simulated Cash/Check Deposit',
      });
      setShowConfirm(false);
      setSuccess(res.data);
      setAmount('');
      setDescription('');
    } catch (err) {
      setShowConfirm(false);
      setError(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading eligible accounts..." />;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="card shadow-sm border-0 rounded-4">
        <div className="card-header bg-white py-3 border-bottom">
          <div className="d-flex align-items-center">
            <div className="bg-success bg-opacity-10 text-success p-2 rounded-circle me-3">
              <i className="bi bi-arrow-down-left-circle fs-4"></i>
            </div>
            <div>
              <h4 className="fw-bold text-dark mb-0">Simulated Deposit</h4>
              <p className="text-muted small mb-0">Credit funds into an active SmartBank account</p>
            </div>
          </div>
        </div>

        <div className="card-body p-4">
          <ErrorMessage error={error} onDismiss={() => setError(null)} />

          {success && (
            <div className="alert alert-success shadow-sm mb-4" role="alert">
              <h5 className="alert-heading fw-bold">
                <i className="bi bi-check-circle-fill me-2"></i>Deposit Successful!
              </h5>
              <p className="mb-1">
                Amount of <strong>${parseFloat(success.amount).toFixed(2)} USD</strong> has been credited to account{' '}
                <strong className="font-monospace">{success.destination_account_number}</strong>.
              </p>
              <div className="small text-muted">
                Transaction Ref: <strong className="font-monospace text-dark">{success.transaction_ref}</strong>
              </div>
              <div className="mt-3">
                <button className="btn btn-sm btn-outline-success me-2" onClick={() => setSuccess(null)}>
                  Make Another Deposit
                </button>
                <button className="btn btn-sm btn-primary" onClick={() => navigate('/dashboard')}>
                  Go to Dashboard &rarr;
                </button>
              </div>
            </div>
          )}

          {accounts.length === 0 ? (
            <div className="alert alert-warning">
              You do not have any active bank accounts available to receive deposits.
            </div>
          ) : (
            <form onSubmit={handleOpenConfirm}>
              <div className="mb-3">
                <label className="form-label fw-semibold text-secondary small">Target Bank Account *</label>
                <select
                  className="form-select form-select-lg"
                  value={selectedAccount}
                  onChange={(e) => setSelectedAccount(e.target.value)}
                  required
                >
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.account_number}>
                      {acc.account_number} ({acc.account_type}) - Balance: ${parseFloat(acc.balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-3">
                <label className="form-label fw-semibold text-secondary small">Deposit Amount (USD) *</label>
                <div className="input-group input-group-lg">
                  <span className="input-group-text">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    className="form-control"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="form-label fw-semibold text-secondary small">Description / Memo</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Salary simulation or cash deposit"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <button type="submit" className="btn btn-success w-100 py-3 fw-bold shadow-sm">
                <i className="bi bi-arrow-down-left-circle me-2"></i>Review Deposit
              </button>
            </form>
          )}
        </div>
      </div>

      <ConfirmationModal
        isOpen={showConfirm}
        title="Confirm Deposit"
        message={`Are you sure you want to deposit $${parseFloat(amount || 0).toFixed(2)} USD into account ${selectedAccount}?`}
        confirmText="Confirm Deposit"
        loading={submitting}
        onConfirm={handleDepositConfirm}
        onCancel={() => setShowConfirm(false)}
      />
    </div>
  );
};

export default DepositPage;

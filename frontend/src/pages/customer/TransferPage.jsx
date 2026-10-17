import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import apiClient from '../../api/axios';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import ConfirmationModal from '../../components/ConfirmationModal';

const TransferPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [accounts, setAccounts] = useState([]);
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [sourceAccount, setSourceAccount] = useState(searchParams.get('source') || '');
  const [destinationAccount, setDestinationAccount] = useState(searchParams.get('destination') || '');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [accRes, benRes] = await Promise.all([
          apiClient.get('/accounts/'),
          apiClient.get('/beneficiaries/'),
        ]);
        const activeAccs = accRes.data.filter((a) => a.status === 'ACTIVE');
        setAccounts(activeAccs);
        setBeneficiaries(benRes.data);
        if (!sourceAccount && activeAccs.length > 0) {
          setSourceAccount(activeAccs[0].account_number);
        }
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [sourceAccount]);

  const currentSource = accounts.find((a) => a.account_number === sourceAccount);

  const handleSelectBeneficiary = (accNum) => {
    setDestinationAccount(accNum);
  };

  const handleOpenConfirm = (e) => {
    e.preventDefault();
    if (!sourceAccount) {
      setError('Please select a source account.');
      return;
    }
    if (!destinationAccount.trim()) {
      setError('Please enter or select a recipient bank account number.');
      return;
    }
    if (sourceAccount.trim() === destinationAccount.trim()) {
      setError('Source and destination accounts must be different.');
      return;
    }
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Transfer amount must be strictly greater than $0.00.');
      return;
    }
    if (currentSource && numAmount > parseFloat(currentSource.balance)) {
      setError(`Insufficient balance. Your source account balance is $${parseFloat(currentSource.balance).toFixed(2)}.`);
      return;
    }

    setError(null);
    setShowConfirm(true);
  };

  const handleTransferConfirm = async () => {
    try {
      setSubmitting(true);
      setError(null);
      const res = await apiClient.post('/transactions/transfer/', {
        source_account_number: sourceAccount.trim(),
        destination_account_number: destinationAccount.trim(),
        amount: parseFloat(amount).toFixed(2),
        description: description.trim() || 'Internal Account Transfer',
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

  if (loading) return <LoadingSpinner message="Loading accounts and payees..." />;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="card shadow-sm border-0 rounded-4">
        <div className="card-header bg-white py-3 border-bottom">
          <div className="d-flex align-items-center">
            <div className="bg-primary bg-opacity-10 text-primary p-2 rounded-circle me-3">
              <i className="bi bi-arrow-left-right fs-4"></i>
            </div>
            <div>
              <h4 className="fw-bold text-dark mb-0">Internal Money Transfer</h4>
              <p className="text-muted small mb-0">Instant simulated transfer between SmartBank accounts</p>
            </div>
          </div>
        </div>

        <div className="card-body p-4">
          <ErrorMessage error={error} onDismiss={() => setError(null)} />

          {success && (
            <div className="alert alert-success shadow-sm mb-4" role="alert">
              <h5 className="alert-heading fw-bold">
                <i className="bi bi-check-circle-fill me-2"></i>Transfer Successful!
              </h5>
              <p className="mb-1">
                You transferred <strong>${parseFloat(success.amount).toFixed(2)} USD</strong> from{' '}
                <strong className="font-monospace">{success.source_account_number}</strong> to{' '}
                <strong className="font-monospace">{success.destination_account_number}</strong>.
              </p>
              <div className="small text-muted">
                Reference: <strong className="font-monospace text-dark">{success.transaction_ref}</strong>
              </div>
              <div className="mt-3">
                <button className="btn btn-sm btn-outline-primary me-2" onClick={() => setSuccess(null)}>
                  Make Another Transfer
                </button>
                <button className="btn btn-sm btn-primary" onClick={() => navigate('/dashboard')}>
                  Go to Dashboard &rarr;
                </button>
              </div>
            </div>
          )}

          {accounts.length === 0 ? (
            <div className="alert alert-warning">
              You do not have any active bank accounts available to send funds.
            </div>
          ) : (
            <form onSubmit={handleOpenConfirm}>
              {/* Source Account */}
              <div className="mb-3">
                <label className="form-label fw-semibold text-secondary small">From Account *</label>
                <select
                  className="form-select form-select-lg"
                  value={sourceAccount}
                  onChange={(e) => setSourceAccount(e.target.value)}
                  required
                >
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.account_number}>
                      {acc.account_number} ({acc.account_type}) - Balance: ${parseFloat(acc.balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </option>
                  ))}
                </select>
                {currentSource && (
                  <div className="form-text text-primary fw-semibold">
                    Available balance: ${parseFloat(currentSource.balance).toLocaleString('en-US', { minimumFractionDigits: 2 })} USD
                  </div>
                )}
              </div>

              {/* Beneficiary Quick Select */}
              {beneficiaries.length > 0 && (
                <div className="mb-3 p-3 bg-light rounded-3 border">
                  <span className="small fw-bold text-muted d-block mb-2">
                    <i className="bi bi-people-fill me-1"></i> Quick Select Saved Beneficiary:
                  </span>
                  <div className="d-flex flex-wrap gap-2">
                    {beneficiaries.map((b) => (
                      <button
                        key={b.id}
                        type="button"
                        className={`btn btn-sm ${
                          destinationAccount === b.beneficiary_account_number
                            ? 'btn-primary'
                            : 'btn-outline-secondary'
                        }`}
                        onClick={() => handleSelectBeneficiary(b.beneficiary_account_number)}
                      >
                        {b.beneficiary_name} ({b.beneficiary_account_number})
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Destination Account */}
              <div className="mb-3">
                <label className="form-label fw-semibold text-secondary small">To Account Number *</label>
                <div className="input-group input-group-lg">
                  <span className="input-group-text"><i className="bi bi-bank2"></i></span>
                  <input
                    type="text"
                    className="form-control font-monospace"
                    placeholder="e.g. SB1002000001"
                    value={destinationAccount}
                    onChange={(e) => setDestinationAccount(e.target.value)}
                    required
                  />
                </div>
                <div className="form-text">Enter any valid 12-character SmartBank account number.</div>
              </div>

              {/* Amount */}
              <div className="mb-3">
                <label className="form-label fw-semibold text-secondary small">Amount to Transfer (USD) *</label>
                <div className="input-group input-group-lg">
                  <span className="input-group-text">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={currentSource ? currentSource.balance : undefined}
                    className="form-control"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Description */}
              <div className="mb-4">
                <label className="form-label fw-semibold text-secondary small">Payment Note / Description</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Rent payment or project contribution"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <button type="submit" className="btn btn-primary w-100 py-3 fw-bold shadow-sm">
                <i className="bi bi-arrow-left-right me-2"></i>Review Transfer
              </button>
            </form>
          )}
        </div>
      </div>

      <ConfirmationModal
        isOpen={showConfirm}
        title="Confirm Transfer"
        message={`Are you sure you want to transfer $${parseFloat(amount || 0).toFixed(2)} USD from ${sourceAccount} to ${destinationAccount}?`}
        confirmText="Confirm & Send"
        loading={submitting}
        onConfirm={handleTransferConfirm}
        onCancel={() => setShowConfirm(false)}
      />
    </div>
  );
};

export default TransferPage;

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import apiClient from '../../api/axios';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import StatusBadge from '../../components/StatusBadge';

const AccountStatement = () => {
  const [searchParams] = useSearchParams();
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(searchParams.get('account') || '');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statementData, setStatementData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        setLoading(true);
        const res = await apiClient.get('/accounts/');
        setAccounts(res.data);
        if (!selectedAccount && res.data.length > 0) {
          setSelectedAccount(res.data[0].account_number);
        }
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchAccounts();
  }, [selectedAccount]);

  useEffect(() => {
    if (!selectedAccount) return;

    const fetchStatement = async () => {
      try {
        const res = await apiClient.get('/transactions/', {
          params: {
            account_number: selectedAccount,
            start_date: startDate || undefined,
            end_date: endDate || undefined,
          },
        });
        setStatementData(res.data);
      } catch (err) {
        setError(err);
      }
    };

    fetchStatement();
  }, [selectedAccount, startDate, endDate]);

  const handleExportCSV = async () => {
    if (!selectedAccount) return;
    try {
      setExporting(true);
      setError(null);
      const token = localStorage.getItem('smartbank_access_token');
      const params = new URLSearchParams({
        account_number: selectedAccount,
        ...(startDate && { start_date: startDate }),
        ...(endDate && { end_date: endDate }),
      });

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'}/transactions/export-csv/?${params}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to download CSV statement');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `SmartBank_Statement_${selectedAccount}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      setError(err);
    } finally {
      setExporting(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading account statement..." />;

  const currentAcc = accounts.find((a) => a.account_number === selectedAccount);

  return (
    <div>
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 pb-2 border-bottom">
        <div>
          <h2 className="fw-bold text-dark mb-1">Account Statement</h2>
          <p className="text-muted small mb-0">Review statement records and export official CSV statement sheets</p>
        </div>
        <button
          className="btn btn-success btn-sm mt-3 mt-md-0 fw-semibold"
          disabled={exporting || !selectedAccount}
          onClick={handleExportCSV}
        >
          {exporting ? (
            <>
              <span className="spinner-border spinner-border-sm me-2"></span>
              Generating CSV...
            </>
          ) : (
            <>
              <i className="bi bi-file-earmark-arrow-down me-1"></i> Export Statement CSV
            </>
          )}
        </button>
      </div>

      <ErrorMessage error={error} onDismiss={() => setError(null)} />

      {/* Account & Date Range Filter */}
      <div className="card shadow-sm border-0 rounded-3 mb-4 bg-white p-3">
        <div className="row g-3 align-items-end">
          <div className="col-12 col-md-4">
            <label className="form-label small fw-semibold text-secondary">Select Account</label>
            <select
              className="form-select form-select-sm font-monospace"
              value={selectedAccount}
              onChange={(e) => setSelectedAccount(e.target.value)}
            >
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.account_number}>
                  {acc.account_number} ({acc.account_type}) - ${parseFloat(acc.balance).toFixed(2)}
                </option>
              ))}
            </select>
          </div>

          <div className="col-6 col-md-3">
            <label className="form-label small fw-semibold text-secondary">Statement Start Date</label>
            <input
              type="date"
              className="form-control form-control-sm"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <div className="col-6 col-md-3">
            <label className="form-label small fw-semibold text-secondary">Statement End Date</label>
            <input
              type="date"
              className="form-control form-control-sm"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

          <div className="col-12 col-md-2 text-md-end">
            <button
              className="btn btn-outline-secondary btn-sm w-100"
              onClick={() => {
                setStartDate('');
                setEndDate('');
              }}
            >
              Reset Dates
            </button>
          </div>
        </div>
      </div>

      {/* Account Info Header */}
      {currentAcc && (
        <div className="card shadow-sm border-0 rounded-3 mb-4 bg-white p-4">
          <div className="row">
            <div className="col-sm-6">
              <span className="text-muted small">Statement For:</span>
              <h5 className="fw-bold text-dark font-monospace mb-1">{currentAcc.account_number}</h5>
              <div className="d-flex gap-2">
                <StatusBadge status={currentAcc.account_type} />
                <StatusBadge status={currentAcc.status} />
              </div>
            </div>
            <div className="col-sm-6 text-sm-end mt-3 mt-sm-0">
              <span className="text-muted small">Closing Balance:</span>
              <h3 className="fw-bold text-dark mb-0">${parseFloat(currentAcc.balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}</h3>
              <small className="text-muted">{currentAcc.currency}</small>
            </div>
          </div>
        </div>
      )}

      {/* Statement Table */}
      <div className="card shadow-sm border-0 rounded-3">
        <div className="card-header bg-white py-3">
          <h5 className="fw-bold text-dark mb-0">Statement Entries ({statementData.length})</h5>
        </div>
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th className="ps-4">Reference</th>
                <th>Date</th>
                <th>Type</th>
                <th>Direction</th>
                <th>Amount</th>
                <th>Description</th>
                <th className="pe-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {statementData.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-5 text-muted">
                    No transactions found for this account in the selected date range.
                  </td>
                </tr>
              ) : (
                statementData.map((t) => {
                  const isCredit = t.destination_account_number === selectedAccount;
                  return (
                    <tr key={t.id}>
                      <td className="ps-4 font-monospace small text-primary fw-semibold">{t.transaction_ref}</td>
                      <td className="small text-muted">{new Date(t.created_at).toLocaleDateString()}</td>
                      <td><StatusBadge status={t.transaction_type} /></td>
                      <td>
                        {isCredit ? (
                          <span className="badge bg-success-subtle text-success">Credit (+)</span>
                        ) : (
                          <span className="badge bg-danger-subtle text-danger">Debit (-)</span>
                        )}
                      </td>
                      <td className={`fw-bold ${isCredit ? 'text-success' : 'text-danger'}`}>
                        {isCredit ? '+' : '-'}${parseFloat(t.amount).toFixed(2)}
                      </td>
                      <td className="small text-secondary">{t.description}</td>
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

export default AccountStatement;

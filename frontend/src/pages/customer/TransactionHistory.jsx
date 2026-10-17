import React, { useState, useEffect } from 'react';
import apiClient from '../../api/axios';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import StatusBadge from '../../components/StatusBadge';
import Pagination from '../../components/Pagination';

const TransactionHistory = () => {
  const [transactions, setTransactions] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [selectedAccount, setSelectedAccount] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Client-side pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [accRes, txnRes] = await Promise.all([
        apiClient.get('/accounts/'),
        apiClient.get('/transactions/', {
          params: {
            account_number: selectedAccount || undefined,
            type: selectedType || undefined,
            start_date: startDate || undefined,
            end_date: endDate || undefined,
          },
        }),
      ]);
      setAccounts(accRes.data);
      setTransactions(txnRes.data);
      setCurrentPage(1);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedAccount, selectedType, startDate, endDate]);

  const handleResetFilters = () => {
    setSelectedAccount('');
    setSelectedType('');
    setStartDate('');
    setEndDate('');
  };

  const totalPages = Math.ceil(transactions.length / itemsPerPage);
  const displayedTxns = transactions.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4 pb-2 border-bottom">
        <div>
          <h2 className="fw-bold text-dark mb-1">Transaction History</h2>
          <p className="text-muted small mb-0">Search, filter, and audit all incoming and outgoing account activities</p>
        </div>
      </div>

      <ErrorMessage error={error} onDismiss={() => setError(null)} />

      {/* Filter Toolbar */}
      <div className="card shadow-sm border-0 rounded-3 mb-4 bg-white p-3">
        <div className="row g-2 align-items-end">
          <div className="col-12 col-md-3">
            <label className="form-label small fw-semibold text-secondary">Filter by Account</label>
            <select
              className="form-select form-select-sm"
              value={selectedAccount}
              onChange={(e) => setSelectedAccount(e.target.value)}
            >
              <option value="">All My Accounts</option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.account_number}>
                  {acc.account_number} ({acc.account_type})
                </option>
              ))}
            </select>
          </div>

          <div className="col-12 col-md-2">
            <label className="form-label small fw-semibold text-secondary">Transaction Type</label>
            <select
              className="form-select form-select-sm"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
            >
              <option value="">All Types</option>
              <option value="DEPOSIT">Deposit</option>
              <option value="WITHDRAWAL">Withdrawal</option>
              <option value="TRANSFER">Internal Transfer</option>
            </select>
          </div>

          <div className="col-6 col-md-2">
            <label className="form-label small fw-semibold text-secondary">From Date</label>
            <input
              type="date"
              className="form-control form-control-sm"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <div className="col-6 col-md-2">
            <label className="form-label small fw-semibold text-secondary">To Date</label>
            <input
              type="date"
              className="form-control form-control-sm"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

          <div className="col-12 col-md-3 text-md-end">
            <button className="btn btn-outline-secondary btn-sm w-100 w-md-auto" onClick={handleResetFilters}>
              <i className="bi bi-arrow-counterclockwise me-1"></i> Reset Filters
            </button>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="card shadow-sm border-0 rounded-3">
        {loading ? (
          <LoadingSpinner message="Filtering transactions..." />
        ) : (
          <>
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th className="ps-4">Reference</th>
                    <th>Date & Time</th>
                    <th>Type</th>
                    <th>Source Account</th>
                    <th>Destination Account</th>
                    <th>Amount</th>
                    <th>Description</th>
                    <th className="pe-4">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedTxns.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="text-center py-5 text-muted">
                        No transactions match your current search filters.
                      </td>
                    </tr>
                  ) : (
                    displayedTxns.map((t) => (
                      <tr key={t.id}>
                        <td className="ps-4 font-monospace small text-primary fw-semibold">{t.transaction_ref}</td>
                        <td className="small text-muted">{new Date(t.created_at).toLocaleString()}</td>
                        <td><StatusBadge status={t.transaction_type} /></td>
                        <td className="small font-monospace text-secondary">
                          {t.source_account_number || <span className="text-muted">CASH / EXTERNAL</span>}
                        </td>
                        <td className="small font-monospace text-secondary">
                          {t.destination_account_number || <span className="text-muted">CASH / EXTERNAL</span>}
                        </td>
                        <td className="fw-bold text-dark">${parseFloat(t.amount).toFixed(2)}</td>
                        <td className="small text-secondary">{t.description}</td>
                        <td className="pe-4"><StatusBadge status={t.status} /></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="p-3">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={(page) => setCurrentPage(page)}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default TransactionHistory;

import React, { useState, useEffect } from 'react';
import apiClient from '../../api/axios';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import StatusBadge from '../../components/StatusBadge';
import Pagination from '../../components/Pagination';

const TransactionManagement = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [typeFilter, setTypeFilter] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiClient.get('/transactions/', {
        params: {
          account_number: accountNumber.trim() || undefined,
          type: typeFilter || undefined,
          start_date: startDate || undefined,
          end_date: endDate || undefined,
        },
      });
      setTransactions(res.data);
      setCurrentPage(1);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [typeFilter, startDate, endDate]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchTransactions();
  };

  const totalPages = Math.ceil(transactions.length / itemsPerPage);
  const displayedTxns = transactions.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4 pb-2 border-bottom">
        <div>
          <h2 className="fw-bold text-dark mb-1">Global Transaction Ledger</h2>
          <p className="text-muted small mb-0">Institutional audit view of all simulated banking deposits, withdrawals, and transfers</p>
        </div>
      </div>

      <ErrorMessage error={error} onDismiss={() => setError(null)} />

      {/* Filter Toolbar */}
      <div className="card shadow-sm border-0 rounded-3 mb-4 bg-white p-3">
        <form onSubmit={handleSearchSubmit} className="row g-2 align-items-end">
          <div className="col-12 col-md-3">
            <label className="form-label small fw-semibold text-secondary">Account Number</label>
            <input
              type="text"
              className="form-control form-control-sm font-monospace"
              placeholder="e.g. SB1001000001"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
            />
          </div>

          <div className="col-6 col-md-2">
            <label className="form-label small fw-semibold text-secondary">Type</label>
            <select
              className="form-select form-select-sm"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
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

          <div className="col-6 col-md-3 text-md-end">
            <button type="submit" className="btn btn-primary btn-sm me-2">Search</button>
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm"
              onClick={() => {
                setAccountNumber('');
                setTypeFilter('');
                setStartDate('');
                setEndDate('');
                fetchTransactions();
              }}
            >
              Reset
            </button>
          </div>
        </form>
      </div>

      {/* Ledger Table */}
      <div className="card shadow-sm border-0 rounded-3">
        {loading ? (
          <LoadingSpinner message="Querying global transactions..." />
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
                        No transactions found in this date range.
                      </td>
                    </tr>
                  ) : (
                    displayedTxns.map((t) => (
                      <tr key={t.id}>
                        <td className="ps-4 font-monospace small text-primary fw-semibold">{t.transaction_ref}</td>
                        <td className="small text-muted">{new Date(t.created_at).toLocaleString()}</td>
                        <td><StatusBadge status={t.transaction_type} /></td>
                        <td className="small font-monospace">
                          {t.source_account_number ? (
                            <div>
                              <span>{t.source_account_number}</span>
                              {t.source_customer_name && <small className="d-block text-muted">{t.source_customer_name}</small>}
                            </div>
                          ) : (
                            <span className="text-muted">CASH / EXTERNAL</span>
                          )}
                        </td>
                        <td className="small font-monospace">
                          {t.destination_account_number ? (
                            <div>
                              <span>{t.destination_account_number}</span>
                              {t.destination_customer_name && <small className="d-block text-muted">{t.destination_customer_name}</small>}
                            </div>
                          ) : (
                            <span className="text-muted">CASH / EXTERNAL</span>
                          )}
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

export default TransactionManagement;

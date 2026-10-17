import React from 'react';

const StatusBadge = ({ status }) => {
  const norm = (status || '').toUpperCase();

  switch (norm) {
    case 'ACTIVE':
    case 'SUCCESS':
      return <span className="badge bg-success-subtle text-success border border-success-subtle px-2 py-1"><i className="bi bi-check-circle-fill me-1"></i>{norm}</span>;
    case 'FROZEN':
      return <span className="badge bg-warning-subtle text-warning border border-warning-subtle px-2 py-1"><i className="bi bi-snow me-1"></i>{norm}</span>;
    case 'CLOSED':
    case 'FAILED':
      return <span className="badge bg-danger-subtle text-danger border border-danger-subtle px-2 py-1"><i className="bi bi-x-circle-fill me-1"></i>{norm}</span>;
    case 'SAVINGS':
      return <span className="badge bg-primary-subtle text-primary border border-primary-subtle px-2 py-1"><i className="bi bi-piggy-bank me-1"></i>Savings</span>;
    case 'CURRENT':
      return <span className="badge bg-info-subtle text-info border border-info-subtle px-2 py-1"><i className="bi bi-briefcase me-1"></i>Current</span>;
    case 'DEPOSIT':
      return <span className="badge bg-success-subtle text-success border border-success-subtle px-2 py-1"><i className="bi bi-arrow-down-left me-1"></i>Deposit</span>;
    case 'WITHDRAWAL':
      return <span className="badge bg-danger-subtle text-danger border border-danger-subtle px-2 py-1"><i className="bi bi-arrow-up-right me-1"></i>Withdrawal</span>;
    case 'TRANSFER':
      return <span className="badge bg-primary-subtle text-primary border border-primary-subtle px-2 py-1"><i className="bi bi-arrow-left-right me-1"></i>Transfer</span>;
    default:
      return <span className="badge bg-secondary-subtle text-secondary px-2 py-1">{norm}</span>;
  }
};

export default StatusBadge;

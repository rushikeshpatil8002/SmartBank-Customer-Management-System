import React from 'react';

const ErrorMessage = ({ error, onDismiss }) => {
  if (!error) return null;

  let message = 'An unexpected error occurred.';
  if (typeof error === 'string') {
    message = error;
  } else if (error?.response?.data) {
    const data = error.response.data;
    if (data.detail) {
      message = data.detail;
    } else if (typeof data === 'object') {
      message = Object.entries(data)
        .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(' ') : v}`)
        .join(' | ');
    }
  } else if (error?.message) {
    message = error.message;
  }

  return (
    <div className="alert alert-danger alert-dismissible fade show shadow-sm" role="alert">
      <i className="bi bi-exclamation-triangle-fill me-2"></i>
      <strong>Error:</strong> {message}
      {onDismiss && (
        <button type="button" className="btn-close" aria-label="Close" onClick={onDismiss}></button>
      )}
    </div>
  );
};

export default ErrorMessage;

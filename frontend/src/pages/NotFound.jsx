import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light text-center px-3">
      <div>
        <h1 className="display-1 fw-bold text-primary">404</h1>
        <h3 className="fw-bold text-dark mb-3">Page Not Found</h3>
        <p className="text-muted mb-4">The banking page or resource you are looking for does not exist or has been moved.</p>
        <Link to="/dashboard" className="btn btn-primary px-4 py-2 fw-semibold">
          <i className="bi bi-house-door me-2"></i>Return to Dashboard
        </Link>
      </div>
    </div>
  );
};

export default NotFound;

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import ErrorMessage from '../../components/ErrorMessage';

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    email: '',
    full_name: '',
    phone_number: '',
    address: '',
    account_type: 'SAVINGS',
    initial_deposit: '100.00',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successData, setSuccessData] = useState(null);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await register({
        username: formData.username.trim(),
        password: formData.password,
        email: formData.email.trim(),
        full_name: formData.full_name.trim(),
        phone_number: formData.phone_number.trim(),
        address: formData.address.trim(),
        account_type: formData.account_type,
        initial_deposit: formData.initial_deposit,
      });
      setSuccessData(res);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  if (successData) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light py-5 px-3">
        <div className="card shadow-lg border-0 rounded-4 w-100 text-center p-4 p-sm-5" style={{ maxWidth: '520px' }}>
          <div className="bg-success bg-opacity-10 text-success p-3 rounded-circle d-inline-block mx-auto mb-3">
            <i className="bi bi-check-circle-fill fs-1"></i>
          </div>
          <h3 className="fw-bold text-dark">Welcome to SmartBank!</h3>
          <p className="text-muted">Your online banking profile and primary account have been initialized.</p>

          <div className="bg-light p-3 rounded-3 text-start mb-4 border">
            <div className="d-flex justify-content-between mb-2">
              <span className="text-muted">Account Number:</span>
              <strong className="text-primary font-monospace">{successData.account_number}</strong>
            </div>
            <div className="d-flex justify-content-between mb-2">
              <span className="text-muted">Account Type:</span>
              <span className="badge bg-primary-subtle text-primary">{successData.account_type}</span>
            </div>
            <div className="d-flex justify-content-between">
              <span className="text-muted">Opening Balance:</span>
              <strong className="text-success">${successData.initial_balance} USD</strong>
            </div>
          </div>

          <button className="btn btn-primary w-100 py-2 fw-bold" onClick={() => navigate('/login')}>
            Proceed to Login &rarr;
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light py-5 px-3">
      <div className="card shadow-lg border-0 rounded-4 w-100" style={{ maxWidth: '640px' }}>
        <div className="card-body p-4 p-sm-5">
          <div className="text-center mb-4">
            <div className="bg-primary bg-opacity-10 text-primary p-3 rounded-circle d-inline-block mb-3">
              <i className="bi bi-person-plus-fill fs-1"></i>
            </div>
            <h3 className="fw-bold text-dark">Open a SmartBank Account</h3>
            <p className="text-muted small">Instant simulated registration with online account opening</p>
          </div>

          <ErrorMessage error={error} onDismiss={() => setError(null)} />

          <form onSubmit={handleSubmit}>
            <div className="row g-3">
              <div className="col-sm-6">
                <label className="form-label fw-semibold text-secondary small">Username *</label>
                <input
                  type="text"
                  name="username"
                  className="form-control"
                  placeholder="e.g. johndoe"
                  value={formData.username}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="col-sm-6">
                <label className="form-label fw-semibold text-secondary small">Email Address</label>
                <input
                  type="email"
                  name="email"
                  className="form-control"
                  placeholder="john@example.com"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>

              <div className="col-sm-6">
                <label className="form-label fw-semibold text-secondary small">Password (Min 8 chars) *</label>
                <input
                  type="password"
                  name="password"
                  className="form-control"
                  placeholder="Enter strong password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength={8}
                />
              </div>

              <div className="col-sm-6">
                <label className="form-label fw-semibold text-secondary small">Confirm Password *</label>
                <input
                  type="password"
                  name="confirmPassword"
                  className="form-control"
                  placeholder="Re-enter password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="col-12">
                <hr className="my-2" />
                <h6 className="fw-bold text-dark mb-2">Personal Details</h6>
              </div>

              <div className="col-sm-6">
                <label className="form-label fw-semibold text-secondary small">Full Name *</label>
                <input
                  type="text"
                  name="full_name"
                  className="form-control"
                  placeholder="First and Last Name"
                  value={formData.full_name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="col-sm-6">
                <label className="form-label fw-semibold text-secondary small">Phone Number *</label>
                <input
                  type="text"
                  name="phone_number"
                  className="form-control"
                  placeholder="+1-555-0100"
                  value={formData.phone_number}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="col-12">
                <label className="form-label fw-semibold text-secondary small">Physical Address *</label>
                <input
                  type="text"
                  name="address"
                  className="form-control"
                  placeholder="Street, City, Postal Code"
                  value={formData.address}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="col-sm-6">
                <label className="form-label fw-semibold text-secondary small">Primary Account Type</label>
                <select
                  name="account_type"
                  className="form-select"
                  value={formData.account_type}
                  onChange={handleChange}
                >
                  <option value="SAVINGS">Savings Account</option>
                  <option value="CURRENT">Current Account</option>
                </select>
              </div>

              <div className="col-sm-6">
                <label className="form-label fw-semibold text-secondary small">Initial Opening Deposit ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  name="initial_deposit"
                  className="form-control"
                  value={formData.initial_deposit}
                  onChange={handleChange}
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary w-100 py-2 fw-bold shadow-sm mt-4" disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                  Opening Account...
                </>
              ) : (
                'Open Account Now'
              )}
            </button>
          </form>

          <div className="text-center mt-4">
            <span className="text-muted small">Already have an account? </span>
            <Link to="/login" className="small fw-bold text-decoration-none">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import ErrorMessage from '../../components/ErrorMessage';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError('Please provide both username and password.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const user = await login(username.trim(), password);
      if (user.role === 'ADMIN' || user.role === 'STAFF') {
        navigate('/admin/dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (u, p) => {
    setUsername(u);
    setPassword(p);
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light py-5 px-3">
      <div className="card shadow-lg border-0 rounded-4 w-100" style={{ maxWidth: '440px' }}>
        <div className="card-body p-4 p-sm-5">
          <div className="text-center mb-4">
            <div className="bg-primary bg-opacity-10 text-primary p-3 rounded-circle d-inline-block mb-3">
              <i className="bi bi-bank fs-1"></i>
            </div>
            <h3 className="fw-bold text-dark">Welcome to SmartBank</h3>
            <p className="text-muted small">Log in to your secure online banking portal</p>
          </div>

          <ErrorMessage error={error} onDismiss={() => setError(null)} />

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label fw-semibold text-secondary small">Username</label>
              <div className="input-group">
                <span className="input-group-text bg-white"><i className="bi bi-person"></i></span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Enter username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="form-label fw-semibold text-secondary small">Password</label>
              <div className="input-group">
                <span className="input-group-text bg-white"><i className="bi bi-lock"></i></span>
                <input
                  type="password"
                  className="form-control"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary w-100 py-2 fw-bold shadow-sm" disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                  Signing In...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Demonstration Quick Fill */}
          <div className="mt-4 pt-3 border-top">
            <span className="text-muted small fw-semibold d-block text-center mb-2">
              <i className="bi bi-lightning-charge-fill text-warning me-1"></i> Quick Demo Logins:
            </span>
            <div className="d-grid gap-2">
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm text-start"
                onClick={() => handleQuickLogin('alice', 'AlicePassword123!')}
              >
                <i className="bi bi-person-fill text-primary me-2"></i>
                <strong>Customer:</strong> alice / AlicePassword123!
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm text-start"
                onClick={() => handleQuickLogin('staff1', 'StaffPassword123!')}
              >
                <i className="bi bi-person-badge-fill text-success me-2"></i>
                <strong>Staff:</strong> staff1 / StaffPassword123!
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm text-start"
                onClick={() => handleQuickLogin('admin', 'AdminPassword123!')}
              >
                <i className="bi bi-shield-lock-fill text-danger me-2"></i>
                <strong>Admin:</strong> admin / AdminPassword123!
              </button>
            </div>
          </div>

          <div className="text-center mt-4 pt-2">
            <span className="text-muted small">Don't have an account? </span>
            <Link to="/register" className="small fw-bold text-decoration-none">
              Open an Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

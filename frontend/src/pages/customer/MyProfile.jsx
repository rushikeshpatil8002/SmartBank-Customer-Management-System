import React, { useState, useEffect } from 'react';
import apiClient from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';

const MyProfile = () => {
  const { user, updateUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [formData, setFormData] = useState({
    phone_number: '',
    address: '',
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await apiClient.get('/profile/');
        setProfile(res.data);
        setFormData({
          phone_number: res.data.phone_number || '',
          address: res.data.address || '',
        });
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      const res = await apiClient.patch('/profile/', formData);
      setProfile(res.data);
      setSuccess('Profile contact information updated successfully.');
      updateUser({
        ...user,
        full_name: res.data.full_name,
      });
    } catch (err) {
      setError(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading customer profile..." />;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="card shadow-sm border-0 rounded-4">
        <div className="card-header bg-white py-3 border-bottom">
          <div className="d-flex align-items-center">
            <div className="bg-primary bg-opacity-10 text-primary p-2 rounded-circle me-3">
              <i className="bi bi-person-circle fs-4"></i>
            </div>
            <div>
              <h4 className="fw-bold text-dark mb-0">My Customer Profile</h4>
              <p className="text-muted small mb-0">Manage your contact information and view your customer credentials</p>
            </div>
          </div>
        </div>

        <div className="card-body p-4">
          <ErrorMessage error={error} onDismiss={() => setError(null)} />

          {success && (
            <div className="alert alert-success alert-dismissible fade show" role="alert">
              <i className="bi bi-check-circle-fill me-2"></i>{success}
              <button type="button" className="btn-close" onClick={() => setSuccess(null)}></button>
            </div>
          )}

          <div className="row g-3 mb-4 p-3 bg-light rounded-3 border">
            <div className="col-sm-6">
              <span className="text-muted small">Full Legal Name</span>
              <div className="fw-bold text-dark">{profile?.full_name || user?.full_name}</div>
            </div>
            <div className="col-sm-6">
              <span className="text-muted small">Username</span>
              <div className="fw-bold text-dark">{profile?.username || user?.username}</div>
            </div>
            <div className="col-sm-6">
              <span className="text-muted small">Email Address</span>
              <div className="fw-bold text-dark">{profile?.email || user?.email || 'N/A'}</div>
            </div>
            <div className="col-sm-6">
              <span className="text-muted small">Date of Birth</span>
              <div className="fw-bold text-dark">{profile?.date_of_birth || 'Not recorded'}</div>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <h5 className="fw-bold text-dark mb-3">Update Contact Details</h5>

            <div className="mb-3">
              <label className="form-label small fw-semibold text-secondary">Phone Number *</label>
              <input
                type="text"
                name="phone_number"
                className="form-control"
                value={formData.phone_number}
                onChange={handleChange}
                required
              />
            </div>

            <div className="mb-4">
              <label className="form-label small fw-semibold text-secondary">Residential Address *</label>
              <textarea
                name="address"
                className="form-control"
                rows="3"
                value={formData.address}
                onChange={handleChange}
                required
              ></textarea>
            </div>

            <button type="submit" className="btn btn-primary px-4 py-2 fw-semibold" disabled={saving}>
              {saving ? 'Saving Changes...' : 'Save Profile Changes'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default MyProfile;

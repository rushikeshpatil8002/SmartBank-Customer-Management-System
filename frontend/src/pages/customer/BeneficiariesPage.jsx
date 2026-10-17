import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../../api/axios';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import ConfirmationModal from '../../components/ConfirmationModal';

const BeneficiariesPage = () => {
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Add Beneficiary Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState(null);

  // Delete Confirm Modal
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchBeneficiaries = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiClient.get('/beneficiaries/');
      setBeneficiaries(res.data);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBeneficiaries();
  }, []);

  const handleAddBeneficiary = async (e) => {
    e.preventDefault();
    try {
      setModalLoading(true);
      setModalError(null);
      await apiClient.post('/beneficiaries/', {
        beneficiary_name: name.trim(),
        account_number: accountNumber.trim(),
      });
      setShowAddModal(false);
      setName('');
      setAccountNumber('');
      fetchBeneficiaries();
    } catch (err) {
      setModalError(err);
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      setDeleteLoading(true);
      await apiClient.delete(`/beneficiaries/${deleteTarget.id}/`);
      setDeleteTarget(null);
      fetchBeneficiaries();
    } catch (err) {
      setError(err);
      setDeleteTarget(null);
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading saved beneficiaries..." />;

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4 pb-2 border-bottom">
        <div>
          <h2 className="fw-bold text-dark mb-1">Saved Beneficiaries</h2>
          <p className="text-muted small mb-0">Manage trusted transfer recipients for quick and reliable payments</p>
        </div>
        <button className="btn btn-primary btn-sm fw-semibold" onClick={() => setShowAddModal(true)}>
          <i className="bi bi-person-plus me-1"></i> Add Beneficiary
        </button>
      </div>

      <ErrorMessage error={error} onDismiss={() => setError(null)} />

      <div className="row g-4">
        {beneficiaries.length === 0 ? (
          <div className="col-12">
            <div className="card shadow-sm border-0 text-center py-5">
              <i className="bi bi-people text-muted fs-1 mb-2"></i>
              <h5 className="fw-bold text-dark">No Beneficiaries Added Yet</h5>
              <p className="text-muted small mb-3">Add friends, family, or business partners within SmartBank for instant transfers.</p>
              <div>
                <button className="btn btn-outline-primary btn-sm" onClick={() => setShowAddModal(true)}>
                  Add Your First Payee
                </button>
              </div>
            </div>
          </div>
        ) : (
          beneficiaries.map((b) => (
            <div key={b.id} className="col-12 col-md-6 col-lg-4">
              <div className="card shadow-sm border-0 rounded-3 h-100">
                <div className="card-body p-4 d-flex flex-column">
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div className="bg-primary bg-opacity-10 text-primary p-2 rounded-circle">
                      <i className="bi bi-person-check fs-4"></i>
                    </div>
                    <button
                      className="btn btn-outline-danger btn-sm border-0"
                      title="Remove Beneficiary"
                      onClick={() => setDeleteTarget(b)}
                    >
                      <i className="bi bi-trash"></i>
                    </button>
                  </div>
                  <h5 className="fw-bold text-dark mb-1">{b.beneficiary_name}</h5>
                  <div className="text-muted small mb-3">SmartBank {b.beneficiary_account_type}</div>
                  <div className="bg-light p-2 rounded-2 mb-4 font-monospace text-primary fw-bold small">
                    {b.beneficiary_account_number}
                  </div>
                  <div className="mt-auto">
                    <Link
                      to={`/transfer?destination=${b.beneficiary_account_number}`}
                      className="btn btn-primary btn-sm w-100 fw-semibold"
                    >
                      <i className="bi bi-arrow-left-right me-1"></i> Transfer Money
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="modal show fade d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">Add Beneficiary</h5>
                <button type="button" className="btn-close" onClick={() => setShowAddModal(false)}></button>
              </div>
              <form onSubmit={handleAddBeneficiary}>
                <div className="modal-body">
                  <ErrorMessage error={modalError} onDismiss={() => setModalError(null)} />
                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Beneficiary Name *</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Bob Williams"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label small fw-semibold">SmartBank Account Number *</label>
                    <input
                      type="text"
                      className="form-control font-monospace"
                      placeholder="e.g. SB1002000001"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      required
                    />
                    <div className="form-text small">Must be a valid active internal SmartBank account number.</div>
                  </div>
                </div>
                <div className="modal-footer border-0">
                  <button type="button" className="btn btn-light" onClick={() => setShowAddModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={modalLoading}>
                    {modalLoading ? 'Validating...' : 'Save Beneficiary'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!deleteTarget}
        title="Remove Beneficiary"
        message={`Are you sure you want to remove ${deleteTarget?.beneficiary_name} (${deleteTarget?.beneficiary_account_number}) from your saved payees?`}
        confirmText="Remove"
        isDanger={true}
        loading={deleteLoading}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};

export default BeneficiariesPage;

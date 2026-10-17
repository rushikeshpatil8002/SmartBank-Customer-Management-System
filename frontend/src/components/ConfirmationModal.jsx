import React from 'react';

const ConfirmationModal = ({ isOpen, title, message, confirmText = 'Confirm', cancelText = 'Cancel', isDanger = false, onConfirm, onCancel, loading = false }) => {
  if (!isOpen) return null;

  return (
    <div className="modal show fade d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content shadow-lg border-0">
          <div className="modal-header border-0 pb-0">
            <h5 className="modal-title fw-bold text-dark">{title}</h5>
            <button type="button" className="btn-close" disabled={loading} onClick={onCancel}></button>
          </div>
          <div className="modal-body py-3">
            <p className="text-secondary mb-0">{message}</p>
          </div>
          <div className="modal-footer border-0 pt-0">
            <button type="button" className="btn btn-light px-3" disabled={loading} onClick={onCancel}>
              {cancelText}
            </button>
            <button
              type="button"
              className={`btn ${isDanger ? 'btn-danger' : 'btn-primary'} px-4`}
              disabled={loading}
              onClick={onConfirm}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                  Processing...
                </>
              ) : (
                confirmText
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;

import React from 'react';
import './ConfirmDeleteModal.css';

const ConfirmDeleteModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "אישור מחיקה",
  message = "האם אתה בטוח בביצוע הפעולה הנ\"ל?",
  itemName = "",
  loading = false
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content confirm-delete-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <div className="confirm-delete-content">
            <div className="warning-icon">⚠️</div>
            <p className="confirm-message">{message}</p>
            {itemName && (
              <p className="item-name">
                <strong>{itemName}</strong>
              </p>
            )}
            <p className="warning-text">פעולה זו לא ניתנת לביטול!</p>
          </div>
        </div>
        <div className="modal-actions">
          <button 
            className="btn btn-danger" 
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? 'מוחק...' : 'אישור מחיקה'}
          </button>
          <button 
            className="btn btn-outline" 
            onClick={onClose}
            disabled={loading}
          >
            ביטול
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDeleteModal;
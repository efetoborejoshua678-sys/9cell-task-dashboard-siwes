import React, { useEffect } from 'react';

export default function ToastAlert({ toast, onClose }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(toast.id);
    }, 6000); // auto-close after 6s
    return () => clearTimeout(timer);
  }, [toast.id, onClose]);

  return (
    <div className={`toast-alert-card tone-${toast.type || 'info'}`} role="alert">
      <div className="toast-icon-wrap">
        <span>{toast.type === 'overdue' ? '!' : toast.type === 'warning' ? 'D' : 'I'}</span>
      </div>
      <div className="toast-content">
        <strong className="toast-title">{toast.title}</strong>
        <p className="toast-message">{toast.message}</p>
      </div>
      <button type="button" className="toast-close-btn" onClick={() => onClose(toast.id)} aria-label="Dismiss toast">
        x
      </button>
    </div>
  );
}

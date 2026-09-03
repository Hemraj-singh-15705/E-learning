import React, { useEffect } from 'react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = 'md'
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const modalSizes = {
    sm: 'modal-sm',
    md: '',
    lg: 'modal-lg'
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="modal-backdrop fade show"
        style={{ zIndex: 1050, backgroundColor: 'rgba(0, 0, 0, 0.6)' }}
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div
        className="modal fade show d-block"
        tabIndex={-1}
        role="dialog"
        style={{ zIndex: 1055 }}
      >
        <div className={`modal-dialog modal-dialog-centered ${modalSizes[size]}`} role="document">
          <div
            className="modal-content border shadow-lg"
            style={{
              backgroundColor: '#ffffff',
              color: '#0f172a',
              borderColor: '#e2e8f0',
              borderRadius: '1.25rem',
              boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.25)'
            }}
          >
            {/* Header */}
            <div
              className="modal-header p-3 px-4 d-flex justify-content-between align-items-center border-bottom"
              style={{ borderColor: '#e2e8f0' }}
            >
              <div>
                <h5 className="modal-title fw-bold mb-0 font-display fs-5" style={{ color: '#0f172a' }}>{title}</h5>
                {description && <p className="text-secondary small mb-0 mt-0.5">{description}</p>}
              </div>
              <button
                type="button"
                className="btn-close"
                onClick={onClose}
                aria-label="Close"
              />
            </div>

            {/* Body */}
            <div className="modal-body p-4 text-start" style={{ color: '#0f172a' }}>
              {children}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Modal;

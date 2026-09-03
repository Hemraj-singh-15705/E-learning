import { type InputHTMLAttributes, forwardRef } from 'react';

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
  error?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className = '', label, error, id, ...props }, ref) => {
    return (
      <div className="mb-2 text-start">
        <div className="form-check d-flex align-items-center gap-2">
          <input
            id={id}
            type="checkbox"
            ref={ref}
            className={`form-check-input ms-0 me-1 cursor-pointer ${className}`}
            style={{ width: '18px', height: '18px' }}
            {...props}
          />
          <label htmlFor={id} className="form-check-label small fw-bold text-dark cursor-pointer select-none mb-0" style={{ fontSize: '0.82rem', color: '#0f172a' }}>
            {label}
          </label>
        </div>
        {error && (
          <div className="invalid-feedback d-block text-danger small mt-1" style={{ fontSize: '0.75rem' }}>
            {error}
          </div>
        )}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';
export default Checkbox;

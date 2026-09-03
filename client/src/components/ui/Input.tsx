import { type InputHTMLAttributes, forwardRef } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', label, error, helperText, type = 'text', id, ...props }, ref) => {
    return (
      <div className="mb-3 w-100 text-start">
        {label && (
          <label
            htmlFor={id}
            className="form-label small fw-bold text-uppercase mb-1"
            style={{ color: '#0f172a', fontSize: '0.78rem', letterSpacing: '0.04em' }}
          >
            {label}
          </label>
        )}
        <input
          id={id}
          type={type}
          ref={ref}
          className={`form-control ${error ? 'is-invalid border-danger' : ''} ${className}`}
          style={{
            backgroundColor: '#ffffff',
            color: '#0f172a',
            borderColor: '#cbd5e1',
            fontSize: '0.85rem'
          }}
          {...props}
        />
        {error ? (
          <div className="invalid-feedback d-block text-danger small mt-1" style={{ fontSize: '0.75rem' }}>
            {error}
          </div>
        ) : helperText ? (
          <div className="form-text text-secondary small mt-1" style={{ fontSize: '0.75rem' }}>
            {helperText}
          </div>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
export default Input;

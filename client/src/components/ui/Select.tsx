import { type SelectHTMLAttributes, forwardRef } from 'react';

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: Array<{ value: string; label: string }>;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = '', label, error, options, id, ...props }, ref) => {
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
        <select
          id={id}
          ref={ref}
          className={`form-select ${error ? 'is-invalid border-danger' : ''} ${className}`}
          style={{
            backgroundColor: '#ffffff',
            color: '#0f172a',
            borderColor: '#cbd5e1',
            fontSize: '0.85rem'
          }}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} style={{ color: '#0f172a', backgroundColor: '#ffffff' }}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && (
          <div className="invalid-feedback d-block text-danger small mt-1" style={{ fontSize: '0.75rem' }}>
            {error}
          </div>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';
export default Select;

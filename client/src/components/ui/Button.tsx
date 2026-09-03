import React, { type ButtonHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'gradient' | 'glow';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  className = '',
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled,
  ...props
}) => {
  const baseStyles = 'btn d-inline-flex align-items-center justify-content-center fw-semibold';
  
  const variants = {
    primary: 'btn-primary',
    gradient: 'btn-primary',
    glow: 'btn-outline-primary',
    secondary: 'btn-secondary',
    outline: 'btn-outline-light',
    ghost: 'btn-link text-decoration-none text-light',
    destructive: 'btn-danger'
  };

  const sizes = {
    sm: 'btn-sm px-3 py-1.5 gap-1.5',
    md: 'px-4 py-2 gap-2',
    lg: 'btn-lg px-5 py-2.5 gap-2.5'
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 className="spinner-border spinner-border-sm me-2" />
          <span>Processing...</span>
        </>
      ) : (
        children
      )}
    </button>
  );
};

export default Button;

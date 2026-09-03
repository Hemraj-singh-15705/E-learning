import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'destructive' | 'outline' | 'purple' | 'cyan';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  className = '',
  variant = 'default',
  ...props
}) => {
  const baseStyles = 'badge rounded-pill text-uppercase px-2.5 py-1 fw-bold';
  
  const variants = {
    default: 'bg-secondary text-light',
    primary: 'bg-primary text-light',
    purple: 'bg-info text-dark',
    cyan: 'bg-info text-dark',
    secondary: 'bg-secondary text-light',
    success: 'bg-success text-light',
    warning: 'bg-warning text-dark',
    destructive: 'bg-danger text-light',
    outline: 'border border-secondary text-light bg-transparent'
  };

  return (
    <span className={`${baseStyles} ${variants[variant]} ${className}`} {...props}>
      {children}
    </span>
  );
};

export default Badge;

import React, { useState } from 'react';

export interface AvatarProps {
  src?: string;
  alt?: string;
  initials?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  alt = 'user avatar',
  initials = '',
  size = 'md',
  className = ''
}) => {
  const [error, setError] = useState(false);

  const sizes = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm font-semibold',
    lg: 'h-16 w-16 text-lg font-bold',
    xl: 'h-24 w-24 text-2xl font-extrabold'
  };

  const hasImage = src && !error;

  return (
    <div
      className={`relative shrink-0 rounded-2xl border border-border bg-primary/10 text-primary flex items-center justify-center overflow-hidden uppercase select-none ${sizes[size]} ${className}`}
    >
      {hasImage ? (
        <img
          src={src}
          alt={alt}
          onError={() => setError(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        <span>{initials.slice(0, 2) || alt.slice(0, 2)}</span>
      )}
    </div>
  );
};

export default Avatar;

import React, { type ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export default function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}: ButtonProps) {
  const baseStyles =
    'inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2E6A77] disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    primary: 'bg-[#2E6A77] text-white hover:bg-[#245560]',
    secondary: 'bg-[#F9E5E5] text-[#2E6A77] hover:bg-[#f0d0d0]',
    outline: 'border-2 border-[#2E6A77] text-[#2E6A77] hover:bg-[#2E6A77] hover:text-white',
    ghost: 'text-[#2E6A77] hover:bg-[#F9E5E5]',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

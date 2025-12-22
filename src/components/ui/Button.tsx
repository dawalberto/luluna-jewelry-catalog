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
    'inline-flex items-center justify-center font-bold border-3 border-black transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    primary: 'bg-[#2E6A77] text-white shadow-[2px_2px_0px_0px_#000000] hover:bg-[#245560]',
    secondary: 'bg-white text-black shadow-[2px_2px_0px_0px_#000000] hover:bg-gray-50',
    outline: 'bg-transparent text-black shadow-[2px_2px_0px_0px_#000000] hover:bg-[#2E6A77] hover:text-white',
    ghost: 'border-transparent shadow-none hover:bg-gray-100',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
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

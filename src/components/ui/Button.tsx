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
    'inline-flex items-center justify-center rounded-squircle font-medium transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-(--color-border-strong) focus-visible:ring-offset-2 focus-visible:ring-offset-(--color-bg) disabled:opacity-50 disabled:cursor-not-allowed tracking-wide';

  const variants = {
    primary: 'bg-(--color-primary) text-white hover:brightness-95 active:brightness-90',
    secondary: 'bg-(--color-surface) text-(--color-text) border border-(--color-border) hover:border-(--color-border-strong)',
    outline: 'bg-transparent text-(--color-text) border border-(--color-border-strong) hover:bg-(--color-surface)',
    ghost: 'bg-transparent text-(--color-text) hover:bg-(--color-surface)',
  };

  const sizes = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-5 py-3 text-base',
    lg: 'px-7 py-4 text-lg',
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

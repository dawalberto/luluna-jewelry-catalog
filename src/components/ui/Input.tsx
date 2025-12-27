import { type InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export default function Input({ label, error, className = '', ...props }: InputProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-xs font-semibold text-(--color-muted) mb-1 uppercase tracking-[0.18em]">
          {label}
        </label>
      )}
      <input
        className={`w-full px-3 py-2 md:px-4 md:py-3 rounded-squircle border bg-(--color-surface-2) border-(--color-border) font-body text-(--color-text) transition-all focus:outline-none focus:ring-2 focus:ring-(--color-border-strong) placeholder-[color:var(--color-muted)] ${
          error ? 'border-red-500' : ''
        } ${className}`}
        {...props}
      />
      {error && <p className="mt-1 text-sm font-bold text-red-600">{error}</p>}
    </div>
  );
}

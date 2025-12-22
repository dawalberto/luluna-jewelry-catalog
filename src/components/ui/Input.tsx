import { type InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export default function Input({ label, error, className = '', ...props }: InputProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-bold text-black mb-1 uppercase tracking-wide">
          {label}
        </label>
      )}
      <input
        className={`w-full px-4 py-3 border-3 border-black font-medium transition-all focus:outline-none focus:shadow-[2px_2px_0px_0px_#000000] focus:-translate-y-1 focus:-translate-x-1 ${
          error ? 'bg-red-50' : 'bg-white'
        } ${className}`}
        {...props}
      />
      {error && <p className="mt-1 text-sm font-bold text-red-600">{error}</p>}
    </div>
  );
}

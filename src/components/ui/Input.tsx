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
        className={`w-full px-4 py-3 border border-gray-300 bg-white/50 font-body transition-all focus:outline-none focus:border-[#2E6A77] focus:ring-1 focus:ring-[#2E6A77] placeholder-gray-400 ${
          error ? 'border-red-500' : ''
        } ${className}`}
        {...props}
      />
      {error && <p className="mt-1 text-sm font-bold text-red-600">{error}</p>}
    </div>
  );
}

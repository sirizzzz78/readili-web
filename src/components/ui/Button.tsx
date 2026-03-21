import { type ButtonHTMLAttributes, type ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost';
  children: ReactNode;
}

export function Button({ variant = 'primary', children, className = '', disabled, ...props }: ButtonProps) {
  const base = `w-full py-5 mx-auto rounded-[20px] font-semibold text-[16px] transition-all duration-150 mt-2 mb-2 ${disabled ? 'cursor-not-allowed' : 'active:scale-[0.98]'}`;

  const variants = {
    primary: `${base} ${disabled ? 'bg-[var(--lavender)] text-white opacity-35' : 'bg-[var(--lavender)] text-white hover:opacity-90'}`,
    ghost: `${base} text-[var(--text-primary)] font-medium bg-transparent border border-[var(--border)] ${disabled ? 'opacity-35' : 'hover:bg-[var(--surface)]'}`,
  };

  return (
    <button className={`${variants[variant]} ${className}`} disabled={disabled} {...props}>
      {children}
    </button>
  );
}

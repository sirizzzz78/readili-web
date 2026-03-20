import { type HTMLAttributes, type ReactNode } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  bg?: string;
  noPadding?: boolean;
  children: ReactNode;
}

export function Card({ bg, noPadding, children, className = '', style, ...props }: CardProps) {
  return (
    <div
      className={`rounded-[14px] border border-[var(--border)] ${className}`}
      style={{
        backgroundColor: bg || 'var(--surface)',
        ...(!noPadding && { padding: 'var(--card-px)' }),
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
}

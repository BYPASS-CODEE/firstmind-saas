import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  hoverEffect?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  hoverEffect = false,
  ...props
}) => {
  return (
    <div
      className={`rounded-xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/90 text-zinc-900 dark:text-zinc-100 shadow-sm transition-all ${
        hoverEffect ? 'hover:border-zinc-300 dark:hover:border-zinc-700/90 hover:shadow-md' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

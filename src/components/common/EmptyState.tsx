import React from 'react';
import { Button } from './Button';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className = ''
}) => {
  return (
    <div className={`flex flex-col items-center justify-center p-8 sm:p-12 text-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50/50 dark:bg-zinc-900/40 ${className}`}>
      {icon && (
        <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 dark:text-zinc-400 mb-4">
          {icon}
        </div>
      )}
      <h4 className="text-base font-medium text-zinc-900 dark:text-zinc-100">{title}</h4>
      <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-md mt-1.5 leading-relaxed">{description}</p>
      {actionLabel && onAction && (
        <Button onClick={onAction} size="sm" variant="secondary" className="mt-5">
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

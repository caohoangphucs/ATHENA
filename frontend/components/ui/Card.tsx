import { ReactNode } from 'react';
import { clsx } from 'clsx';

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={clsx('rounded-xl border border-neutral-200/60 dark:border-neutral-800/60 bg-white dark:bg-neutral-900 shadow-sm', className)}>
      {children}
    </div>
  );
}

export function CardHeader({ title, actions }: { title: string; actions?: ReactNode }) {
  return (
    <div className="flex items-center justify-between p-4 border-b border-neutral-200/60 dark:border-neutral-800/60">
      <h3 className="text-base font-semibold">{title}</h3>
      {actions}
    </div>
  );
}

export function CardBody({ children }: { children: ReactNode }) {
  return <div className="p-4">{children}</div>;
}

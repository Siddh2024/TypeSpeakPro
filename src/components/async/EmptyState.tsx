import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { Inbox } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: LucideIcon;
  className?: string;
}

export const EmptyState = React.memo(({
  title,
  description,
  actionLabel,
  onAction,
  icon: Icon = Inbox,
  className,
}: EmptyStateProps) => (
  <div className={cn('flex min-h-[180px] flex-col items-center justify-center p-8 text-center', className)}>
    <Icon className="mb-4 h-9 w-9 text-muted-foreground" aria-hidden="true" />
    <h3 className="font-semibold text-foreground">{title}</h3>
    {description && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>}
    {actionLabel && onAction && (
      <Button type="button" variant="outline" onClick={onAction} className="mt-5">
        {actionLabel}
      </Button>
    )}
  </div>
));

EmptyState.displayName = 'EmptyState';

import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface SectionSkeletonProps {
  rows?: number;
  className?: string;
}

export const SectionSkeleton = React.memo(({ rows = 4, className }: SectionSkeletonProps) => (
  <div role="status" aria-live="polite" aria-busy="true" className={cn('space-y-3', className)}>
    <span className="sr-only">Loading content</span>
    {Array.from({ length: rows }).map((_, index) => (
      <div key={index} className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
    ))}
  </div>
));

SectionSkeleton.displayName = 'SectionSkeleton';

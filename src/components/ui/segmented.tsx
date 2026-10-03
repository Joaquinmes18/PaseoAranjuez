import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface SegmentedProps<T extends string | number> {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: ReactNode }[];
  className?: string;
}

/** Filtros en texto con subrayado, como la navegación local de apple.com. */
export function Segmented<T extends string | number>({ value, onChange, options, className }: SegmentedProps<T>) {
  return (
    <div className={cn('no-scrollbar flex gap-6 overflow-x-auto border-b border-border', className)}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={String(o.value)}
            onClick={() => onChange(o.value)}
            className={cn(
              '-mb-px shrink-0 whitespace-nowrap border-b-2 pb-2.5 text-[14px] transition-colors',
              active ? 'border-foreground text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

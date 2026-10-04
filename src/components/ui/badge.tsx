import type { HTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

export const badgeVariants = cva(
  'inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'border border-transparent bg-primary text-primary-foreground',
        secondary: 'border border-transparent bg-surface text-foreground hover:bg-muted',
        outline: 'border border-border text-foreground',
        subtle: 'bg-white/10 text-white border border-white/15',
        primary: 'text-white',
        gold: 'bg-amber-500/10 text-amber-300',
        success: 'bg-white/10 text-white border border-white/20',
        danger: 'bg-red-500/10 text-red-400',
      },
    },
    defaultVariants: { variant: 'default' },
  },
);

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

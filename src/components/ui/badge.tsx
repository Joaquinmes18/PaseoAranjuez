import type { HTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/** Etiqueta discreta en texto (estilo "Nuevo" de apple.com), sin píldoras de color. */
export const badgeVariants = cva('inline-flex items-center gap-1 whitespace-nowrap text-[12px] font-semibold', {
  variants: {
    variant: {
      default: 'text-muted-foreground',
      primary: 'text-link',
      gold: 'text-gold',
      success: 'text-success',
      danger: 'text-danger',
    },
  },
  defaultVariants: { variant: 'default' },
});

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

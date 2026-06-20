import { cn } from '@/lib/utils';

const variants = {
  default: 'bg-primary/10 text-primary border-primary/20',
  secondary: 'bg-muted text-muted-foreground border-border',
  destructive: 'bg-red-50 text-destructive border-red-200',
  success: 'bg-emerald-50 text-success border-emerald-200',
  warning: 'bg-amber-50 text-warning border-amber-200',
  outline: 'bg-white text-foreground border-border',
} as const;

export function Badge({
  className,
  variant = 'default',
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & {
  variant?: keyof typeof variants;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}

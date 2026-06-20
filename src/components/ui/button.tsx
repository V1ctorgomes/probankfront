import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

const variants = {
  default:
    'bg-primary text-primary-foreground shadow-sm hover:bg-[#0d6b64] active:scale-[0.98]',
  outline:
    'border border-border bg-white text-foreground hover:bg-muted active:scale-[0.98]',
  secondary:
    'bg-secondary text-secondary-foreground hover:bg-[#d5dee9] active:scale-[0.98]',
  ghost: 'text-foreground hover:bg-muted',
  destructive:
    'bg-red-50 text-destructive border border-red-200 hover:bg-red-100 active:scale-[0.98]',
  link: 'text-primary underline-offset-4 hover:underline',
} as const;

const sizes = {
  default: 'h-10 gap-2 px-4 text-sm',
  sm: 'h-8 gap-1.5 rounded-md px-3 text-xs',
  lg: 'h-11 gap-2 px-5 text-sm',
  icon: 'h-10 w-10',
} as const;

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', type = 'button', ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(
        'inline-flex items-center justify-center rounded-lg font-medium transition-all outline-none focus-visible:ring-2 focus-visible:ring-ring/40 disabled:pointer-events-none disabled:opacity-50',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  ),
);

Button.displayName = 'Button';

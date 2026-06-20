import Link from 'next/link';
import { cn } from '@/lib/utils';

export function TableActions({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      {children}
    </div>
  );
}

export function ActionLink({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        'inline-flex h-8 shrink-0 items-center justify-center rounded-md border border-border bg-white px-3 text-xs font-medium text-foreground transition-all hover:bg-muted',
        className,
      )}
    >
      {children}
    </Link>
  );
}

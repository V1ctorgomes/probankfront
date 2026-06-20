import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

export function FilterBar({
  children,
  className,
  onSubmit,
}: {
  children: React.ReactNode;
  className?: string;
  onSubmit?: (event: React.FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <Card className={cn('overflow-visible', className)}>
      <CardContent className="py-4">
        <form
          onSubmit={onSubmit}
          className="grid gap-4 md:grid-cols-[minmax(160px,200px)_minmax(240px,1fr)_auto] md:items-end"
        >
          {children}
        </form>
      </CardContent>
    </Card>
  );
}

export function FilterField({
  label,
  htmlFor,
  children,
  className,
}: {
  label: string;
  htmlFor?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex min-w-0 flex-col gap-2', className)}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}

export function FilterActions({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex items-end md:justify-end', className)}>
      {children}
    </div>
  );
}

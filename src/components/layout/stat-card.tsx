import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';

const accents = {
  default: 'border-l-primary',
  success: 'border-l-success',
  warning: 'border-l-warning',
  danger: 'border-l-destructive',
} as const;

type StatCardProps = {
  label: string;
  value: React.ReactNode;
  accent?: keyof typeof accents;
  className?: string;
};

export function StatCard({
  label,
  value,
  accent = 'default',
  className,
}: StatCardProps) {
  return (
    <Card className={cn('border-l-4', accents[accent], className)}>
      <CardContent className="py-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <p className="mt-2 text-xl font-bold tracking-tight text-foreground sm:text-2xl">
          {value}
        </p>
      </CardContent>
    </Card>
  );
}

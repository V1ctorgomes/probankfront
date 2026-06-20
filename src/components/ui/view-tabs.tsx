import { cn } from '@/lib/utils';

export type ViewTabOption = {
  id: string;
  label: string;
  count?: number;
};

type ViewTabsProps = {
  tabs: ViewTabOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
};

export function ViewTabs({ tabs, value, onChange, className }: ViewTabsProps) {
  return (
    <div
      className={cn(
        'inline-flex flex-wrap gap-1 rounded-xl border border-border bg-muted/60 p-1',
        className,
      )}
      role="tablist"
    >
      {tabs.map((tab) => {
        const active = value === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab.id)}
            className={cn(
              'rounded-lg px-4 py-2 text-sm font-medium transition-all',
              active
                ? 'bg-white text-primary shadow-sm ring-1 ring-border'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {tab.label}
            {tab.count !== undefined ? ` (${tab.count})` : ''}
          </button>
        );
      })}
    </div>
  );
}

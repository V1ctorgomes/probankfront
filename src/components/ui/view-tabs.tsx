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
        'w-full max-w-full overflow-x-auto rounded-xl border border-border bg-muted/60 p-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
        className,
      )}
      role="tablist"
    >
      <div className="flex w-max min-w-full gap-1 sm:w-auto sm:min-w-0 sm:flex-wrap">
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
                'shrink-0 whitespace-nowrap rounded-lg px-3 py-2 text-xs font-medium transition-all sm:px-4 sm:text-sm',
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
    </div>
  );
}

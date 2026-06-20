import { cn } from '@/lib/utils';

type Option = {
  value: string;
  label: string;
};

type SimpleSelectProps = {
  value?: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
};

export function SimpleSelect({
  value,
  onChange,
  options,
  placeholder = 'Selecione',
  className,
  disabled,
}: SimpleSelectProps) {
  return (
    <select
      value={value ?? ''}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
      className={cn('pb-input appearance-none bg-[length:16px] bg-[right_12px_center] bg-no-repeat pr-10', className)}
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
      }}
    >
      <option value="">{placeholder}</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

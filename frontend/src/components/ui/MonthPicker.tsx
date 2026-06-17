interface MonthPickerProps {
  value: string;
  onChange: (value: string) => void;
  id?: string;
}

export function MonthPicker({ value, onChange, id }: MonthPickerProps) {
  return (
    <input
      id={id}
      type="month"
      className="input max-w-xs"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

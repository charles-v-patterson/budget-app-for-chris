interface CurrencyInputProps {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  id?: string;
}

export function CurrencyInput({ value, onChange, required, id }: CurrencyInputProps) {
  return (
    <input
      id={id}
      type="number"
      step="0.01"
      min="0"
      className="input"
      value={value}
      required={required}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

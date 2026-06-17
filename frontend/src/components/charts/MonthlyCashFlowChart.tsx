import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCurrency } from "../../lib/format";

interface MonthlyCashFlowChartProps {
  data: Array<{ label: string; income: number; expenses: number; net: number }>;
}

export function MonthlyCashFlowChart({ data }: MonthlyCashFlowChartProps) {
  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#2e3345" />
        <XAxis dataKey="label" stroke="#8b92a8" />
        <YAxis stroke="#8b92a8" tickFormatter={(v) => `$${v}`} />
        <Tooltip
          contentStyle={{ background: "#1a1d27", border: "1px solid #2e3345" }}
          formatter={(value: number) => formatCurrency(value)}
        />
        <Legend />
        <Bar dataKey="income" fill="#2dd4bf" name="Income (Net)" />
        <Bar dataKey="expenses" fill="#f87171" name="Expenses (Gross)" />
        <Bar dataKey="net" fill="#60a5fa" name="Net" />
      </BarChart>
    </ResponsiveContainer>
  );
}

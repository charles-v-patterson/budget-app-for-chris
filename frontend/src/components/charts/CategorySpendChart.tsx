import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCurrency } from "../../lib/format";
import type { CategorySpend } from "../../api/types";

interface CategorySpendChartProps {
  data: CategorySpend[];
}

export function CategorySpendChart({ data }: CategorySpendChartProps) {
  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={data} layout="vertical" margin={{ left: 80 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#2e3345" />
        <XAxis type="number" stroke="#8b92a8" tickFormatter={(v) => `$${v}`} />
        <YAxis type="category" dataKey="category" stroke="#8b92a8" width={70} />
        <Tooltip
          contentStyle={{ background: "#1a1d27", border: "1px solid #2e3345" }}
          formatter={(value: number) => formatCurrency(value)}
        />
        <Bar dataKey="total" fill="#2dd4bf" name="Annual Spend" />
      </BarChart>
    </ResponsiveContainer>
  );
}

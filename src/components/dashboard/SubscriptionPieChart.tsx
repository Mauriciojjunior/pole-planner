import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface SubscriptionStats {
  status: string;
  count: number;
  percentage: number;
  total_revenue_cents: number;
}

interface SubscriptionPieChartProps {
  data: SubscriptionStats[];
  title?: string;
}

const statusLabels: Record<string, string> = {
  active: "Ativas",
  cancelled: "Canceladas",
  expired: "Expiradas",
  pending: "Pendentes",
  suspended: "Suspensas",
};

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

export function SubscriptionPieChart({
  data,
  title = "Status das Assinaturas",
}: SubscriptionPieChartProps) {
  const formattedData = data.map((item) => ({
    ...item,
    name: statusLabels[item.status] || item.status,
  }));

  const totalRevenue = data.reduce(
    (acc, item) => acc + item.total_revenue_cents,
    0
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={formattedData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={100}
                fill="#8884d8"
                dataKey="count"
                label={({ name, percentage }) => `${name} ${percentage}%`}
              >
                {formattedData.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number, name: string) => [value, name]}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 text-center">
          <p className="text-sm text-muted-foreground">Receita Total</p>
          <p className="text-2xl font-bold">
            {new Intl.NumberFormat("pt-BR", {
              style: "currency",
              currency: "BRL",
            }).format(totalRevenue / 100)}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

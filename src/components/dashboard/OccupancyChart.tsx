import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

interface ClassStats {
  period: string;
  occupancy_rate: number;
}

interface OccupancyChartProps {
  data: ClassStats[];
  title?: string;
}

const chartConfig = {
  occupancy_rate: {
    label: "Taxa de Ocupação (%)",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig;

export function OccupancyChart({ data, title = "Taxa de Ocupação" }: OccupancyChartProps) {
  const formattedData = data.map((item) => ({
    name: item.period,
    occupancy_rate: item.occupancy_rate,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={formattedData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                domain={[0, 100]}
                tickFormatter={(value) => `${value}%`}
              />
              <ChartTooltip
                content={<ChartTooltipContent formatter={(value) => `${value}%`} />}
              />
              <Line
                type="monotone"
                dataKey="occupancy_rate"
                stroke="var(--color-occupancy_rate)"
                strokeWidth={2}
                dot={{ fill: "var(--color-occupancy_rate)" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

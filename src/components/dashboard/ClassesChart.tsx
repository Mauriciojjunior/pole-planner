import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
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
  total_classes: number;
  confirmed_bookings: number;
  cancelled_bookings: number;
  attendance_count: number;
  occupancy_rate: number;
}

interface ClassesChartProps {
  data: ClassStats[];
  title?: string;
}

const chartConfig = {
  total_classes: {
    label: "Total de Aulas",
    color: "hsl(var(--primary))",
  },
  confirmed_bookings: {
    label: "Reservas Confirmadas",
    color: "hsl(var(--chart-2))",
  },
  attendance_count: {
    label: "Presenças",
    color: "hsl(var(--chart-3))",
  },
} satisfies ChartConfig;

export function ClassesChart({ data, title = "Aulas por Período" }: ClassesChartProps) {
  const formattedData = data.map((item) => ({
    ...item,
    name: item.period,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={formattedData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
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
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Legend />
              <Bar
                dataKey="total_classes"
                name="Total de Aulas"
                fill="var(--color-total_classes)"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="confirmed_bookings"
                name="Reservas Confirmadas"
                fill="var(--color-confirmed_bookings)"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="attendance_count"
                name="Presenças"
                fill="var(--color-attendance_count)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

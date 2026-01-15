import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
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

interface UsageOverTime {
  period: string;
  new_teachers: number;
  new_students: number;
  classes_created: number;
  bookings_made: number;
}

interface UsageLineChartProps {
  data: UsageOverTime[];
  title?: string;
}

const chartConfig = {
  new_teachers: {
    label: "Novos Professores",
    color: "hsl(var(--chart-1))",
  },
  new_students: {
    label: "Novos Alunos",
    color: "hsl(var(--chart-2))",
  },
  classes_created: {
    label: "Aulas Criadas",
    color: "hsl(var(--chart-3))",
  },
  bookings_made: {
    label: "Reservas",
    color: "hsl(var(--chart-4))",
  },
} satisfies ChartConfig;

export function UsageLineChart({
  data,
  title = "Uso da Plataforma",
}: UsageLineChartProps) {
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
            <LineChart
              data={formattedData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Legend />
              <Line
                type="monotone"
                dataKey="new_teachers"
                name="Novos Professores"
                stroke="var(--color-new_teachers)"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="new_students"
                name="Novos Alunos"
                stroke="var(--color-new_students)"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="classes_created"
                name="Aulas Criadas"
                stroke="var(--color-classes_created)"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="bookings_made"
                name="Reservas"
                stroke="var(--color-bookings_made)"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

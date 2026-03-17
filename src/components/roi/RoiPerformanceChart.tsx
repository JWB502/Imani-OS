import * as React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricDefinition, MonthlyMetric } from "@/types/imani";

interface RoiPerformanceChartProps {
  months: MonthlyMetric[];
  revenueMd?: MetricDefinition;
  expensesMd?: MetricDefinition;
}

export function RoiPerformanceChart({
  months,
  revenueMd,
  expensesMd,
}: RoiPerformanceChartProps) {
  const chartData = React.useMemo(() => {
    if (!revenueMd || !expensesMd) return [];

    return months
      .map((m) => {
        const rev = m.values[revenueMd.id] || 0;
        const exp = m.values[expensesMd.id] || 0;
        const roi = exp > 0 ? ((rev - exp) / exp) * 100 : 0;

        return {
          month: m.month,
          label: new Date(m.month + "-01").toLocaleDateString("en-US", {
            month: "short",
            year: "2-digit",
          }),
          roi: Math.round(roi),
          revenue: rev,
          expenses: exp,
        };
      })
      .slice(-13); // Last 13 months for rolling comparison
  }, [months, revenueMd, expensesMd]);

  if (chartData.length === 0) {
    return (
      <Card className="rounded-3xl border border-border/70 bg-white/70 shadow-sm">
        <CardContent className="flex h-[300px] items-center justify-center text-muted-foreground">
          Not enough data to display trend chart.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-3xl border border-border/70 bg-white/70 shadow-sm overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">ROI Trend (%)</CardTitle>
      </CardHeader>
      <CardContent className="p-0 sm:p-6">
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorRoi" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="hsl(var(--border))"
              />
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                tickFormatter={(val) => `${val}%`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--background))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "12px",
                  fontSize: "12px",
                }}
                formatter={(value: number) => [`${value}%`, "ROI"]}
              />
              <Area
                type="monotone"
                dataKey="roi"
                stroke="hsl(var(--primary))"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorRoi)"
                dot={{ r: 4, fill: "hsl(var(--primary))", strokeWidth: 2, stroke: "#fff" }}
                activeDot={{ r: 6, strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

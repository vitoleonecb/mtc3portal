"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

export function GlowingLineChart({ analyticsData = {} }) {
  const timeSeries = analyticsData.timeSeries ?? {};

  console.log(`Time Series Data: ${JSON.stringify(timeSeries)}`);

  if (Object.keys(timeSeries).length === 0) return null;

  const chartData = Object.entries(timeSeries).map(([date, count]) => ({
    date,
    count: Number(count),
  }));

  const lineChartConfig = {
    count: {
      label: "Responses",
      color: "var(--chart-2)",
    },
  };

  return (
    <Card>
      <CardHeader>
        <CardDescription>Responses Over Time</CardDescription>
      </CardHeader>

      <CardContent>
        <ChartContainer config={lineChartConfig}>
          <LineChart
            accessibilityLayer
            data={chartData}
            margin={{ top: 8, left: 12, right: 12, bottom: 36 }}
          >
            {/* SVG defs */}
            <defs>
              {/* dotted background pattern */}
              <pattern
                id="default-pattern-dots"
                x="0"
                y="0"
                width="10"
                height="10"
                patternUnits="userSpaceOnUse"
              >
                <circle
                  cx="2"
                  cy="2"
                  r="1.75"
                  fill="rgb(210,164,120)"
                />
              </pattern>
            </defs>

            {/* dotted background — stops before x-axis labels */}
            <rect
              x="0"
              y="0"
              width="100%"
              height="75%"
              fill="url(#default-pattern-dots)"
              pointerEvents="none"
            />

            {/* grid constrained visually by background */}
            <CartesianGrid
              vertical={false}
              horizontal={false}
            />

            <XAxis
              dataKey="date"
	      interval={0}
	      padding={{ left: 24, right: 24 }}
              tickLine={false}
              axisLine={false}
              tickMargin={10}
              tickFormatter={(value) => value.slice(5)}
            />

            <YAxis hide />

            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />

            <Line
              dataKey="count"
              type="monotone"
              stroke="var(--chart-2)"
              dot={false}
              strokeWidth={3}
              connectNulls
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

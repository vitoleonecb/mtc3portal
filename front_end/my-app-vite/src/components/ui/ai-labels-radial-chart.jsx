"use client";

import React from "react";
import { RadialBar, RadialBarChart } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

/**
 * Props shape:
 * {
 *   analysis: {
 *     labels?: {
 *       labels?: Array<{
 *         id: string;
 *         display: string;
 *         description?: string;
 *         responseIds?: number[];
 *       }>
 *     }
 *   }
 * }
 */
export function AILabelsRadialChart({ analysis }) {
  const rawLabels = analysis?.labels?.labels || [];

  if (!rawLabels.length) return null;

  // Build a stable color palette cycling through the existing chart tokens.
  const palette = [
    "var(--chart-1)",
    "var(--chart-2)",
    "var(--chart-3)",
    "var(--chart-4)",
    "var(--chart-5)",
  ];

  const chartConfig = rawLabels.reduce(
    (acc, label, index) => {
      const color = palette[index % palette.length];
      acc[label.id] = {
        label: label.display,
        color,
      };
      return acc;
    },
    {
      count: {
        label: "Responses",
      },
    }
  );

  const chartData = rawLabels.map((label) => {
    const count = Array.isArray(label.responseIds)
      ? label.responseIds.length
      : 0;

    return {
      id: label.id,
      label: label.display,
      description: label.description,
      count,
      fill: `var(--color-${label.id})`,
    };
  });

  // If everything is zero, there's nothing meaningful to show.
  const hasNonZero = chartData.some((d) => d.count > 0);
  if (!hasNonZero) return null;

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-2">
        <CardTitle>AI Label Coverage</CardTitle>
        <CardDescription>
          How many responses fall under each thematic label.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-4">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[260px]"
        >
          <RadialBarChart
            data={chartData}
            innerRadius={30}
            outerRadius={110}
          >
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  hideLabel
                  nameKey="label"
                  formatter={(value, _name, item) => {
                    const label = item?.payload?.label;
                    if (typeof value !== "number") return null;
                    return (
                      <span className="font-medium">
                        {label}: {value} response{value === 1 ? "" : "s"}
                      </span>
                    );
                  }}
                />
              }
            />
            <RadialBar
              dataKey="count"
              background
              cornerRadius={10}
              className="drop-shadow-lg"
            />
          </RadialBarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

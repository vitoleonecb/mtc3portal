"use client";

import { PolarAngleAxis, PolarGrid, Radar, RadarChart } from "recharts";
import {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Badge } from "@/components/ui/badge";
import { TrendingUp } from "lucide-react";

// Props:
// {
//   analysis: {
//     labels?: {
//       labels?: Array<{
//         id: string;
//         display: string;
//         description?: string;
//         responseIds?: number[];
//       }>;
//     };
//   };
// }

const chartConfig = {
  count: {
    label: "Responses",
    color: "var(--chart-1)",
  },
};

export function GlowingStrokeRadarChart({ analysis }) {
  const rawLabels = analysis?.labels?.labels || [];

  if (!rawLabels.length) return null;

  const chartData = rawLabels.map((label) => ({
    label: label.display,
    count: Array.isArray(label.responseIds) ? label.responseIds.length : 0,
  }));

  // If all counts are zero, nothing useful to show.
  const hasNonZero = chartData.some((d) => d.count > 0);
  if (!hasNonZero) return null;

  const totalTagged = chartData.reduce((sum, d) => sum + d.count, 0);

  return (
    <div className="AiRadarCard">
      <CardHeader className="pb-4">
      </CardHeader>
      <CardContent className="pb-0">
        <ChartContainer
          config={chartConfig}
          className="w-full max-h-[320px]"
        >
          <RadarChart
            data={chartData}
            margin={{ top: 24, right: 32, bottom: 24, left: 32 }}
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
            <PolarAngleAxis dataKey="label" />
            <PolarGrid strokeDasharray="1.5 3" stroke="rgb(210,164,120)" />
            <Radar
              stroke="black"
              strokeWidth={2}
              dataKey="count"
              fill="none"
            />
          </RadarChart>
        </ChartContainer>
      </CardContent>
    </div>
  );
}

"use client";

import { Bar, BarChart, XAxis } from "recharts";
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

const chartConfig = {
  numSelected: {
    label: "Selections",
    color: "var(--chart-1)",
  },
};

export function DefaultBarChart(props) {
  const analyticsData = props.analyticsData || {};
  const dotColor = props.dotColor || 'rgb(210,164,120)';

  if (!analyticsData.questions) return null;

  const questions = analyticsData.questions;

  return (
    <div className="space-y-10">
      {Object.entries(questions).map(([questionId, question]) => {
        const chartData = Object.values(question.options).map((opt) => ({
          option: opt.optionText,
          numSelected: opt.count,
        }));

        return (
          <Card key={questionId}>
            <CardHeader>
              <CardDescription>{question.questionText}</CardDescription>
            </CardHeader>

            <CardContent>
              <ChartContainer config={chartConfig}>
                <BarChart width={500} height={300} data={chartData}>
                  <rect
                    x="0"
                    y="0"
                    width="100%"
                    height="85%"
                    fill="url(#default-pattern-dots)"
                  />
                  <defs>
                    <DottedBackgroundPattern color={dotColor} />
                  </defs>

                  <XAxis 
                    dataKey="option"
                    axisLine={false}
                    tickLine={false}
                    tickMargin={10}
                  />

                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent hideLabel />}
                  />

                  <Bar
                    dataKey="numSelected"
                    fill="var(--color-desktop)"
                    radius={20}
                  />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}


const DottedBackgroundPattern = ({ color = 'rgb(210,164,120)' }) => {
  return (
    <pattern
      id="default-pattern-dots"
      x="0"
      y="0"
      width="10"
      height="10"
      patternUnits="userSpaceOnUse"
    >
      <circle cx="2" cy="2" r="1.75" fill={color} />
    </pattern>
  );
};

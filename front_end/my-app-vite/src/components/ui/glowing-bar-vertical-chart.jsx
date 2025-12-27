"use client";

import React from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

const chartData = [
  { answer: "I stopped him before he could continue", count: 18 },
  { answer: "Three boulders were all it took to dial them in", count: 12 },
  { answer: "Set from his own stone he launched higher for his feet’s sake", count: 27 },
  { answer: "The sequence arbiter was no use to her hair routine", count: 9 }
];

const AnswerBar = ({ x, y, width, height, payload }) => {
  const padding = 16;
  const clipId = `clip-${payload.answer.replace(/\s+/g, "-")}`;

  return (
    <g>
      {/* Define clip path */}
      <defs>
        <clipPath id={clipId}>
          <rect
            x={x}
            y={y}
            width={width}
            height={height}
            rx={12}
          />
        </clipPath>
      </defs>

      {/* Bar */}
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx={12}
        fill="black"
      />

      {/* Text clipped to bar */}
      <text
        x={x + padding}
        y={y + height / 2}
        dominantBaseline="middle"
        fill="white"
        fontSize={14}
        fontWeight={500}
        clipPath={`url(#${clipId})`}
        style={{ pointerEvents: "none" }}
      >
        {payload.answer}
      </text>
    </g>
  );
};

export function GlowingBarVerticalChart({ analyticsData = {} }) {
  if (!analyticsData.questions) return null;

  return (
    <div className="space-y-10">
      {Object.entries(analyticsData.questions).map(
        ([questionId, question]) => {
          const chartData = Object.values(question.options).map(opt => ({
            answer: opt.optionText,
            count: opt.count,
          }));

          const max = Math.max(
            ...chartData.map(d => d.count),
            1 // guard against empty
          );

          return (
            <Card key={questionId}>
              <CardDescription>{question.questionText}</CardDescription>

              <CardContent>
                <ChartContainer
                  config={{
                    count: { label: "Selections", color: "var(--chart-1)" },
                  }}
                >
                  <BarChart
                    layout="vertical"
                    data={chartData}
                    height={chartData.length * 64}
                    margin={{ top: 8, right: 24, left: 24, bottom: 8 }}
                  >
                    {/* dotted background */}
                    <defs>
                      <pattern
                        id={`answer-dots-${questionId}`}
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

                    <rect
                      x="0"
                      y="0"
                      width="100%"
                      height="100%"
                      fill={`url(#answer-dots-${questionId})`}
                      pointerEvents="none"
                    />

                    <XAxis type="number" hide domain={[0, max]} />
                    <YAxis type="category" dataKey="answer" hide />

                    <ChartTooltip
                      cursor={false}
                      content={
                        <ChartTooltipContent
                          hideLabel
                          hideIndicator
                          formatter={(value) => (
                            <span className="font-medium">
                              {value} selections
                            </span>
                          )}
                        />
                      }
                    />

                    <Bar
                      dataKey="count"
                      radius={12}
                      barSize={44}
                      fill="var(--chart-1)"
                      shape={<AnswerBar />}
                    />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          );
        }
      )}
    </div>
  );
}
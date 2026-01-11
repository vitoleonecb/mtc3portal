"use client";

import React from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from "recharts";

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

// Star path reused from rating control for consistent shape
const STAR_PATH_D =
  "M14.0554 2.71739C14.3667 1.82183 15.6333 1.82183 15.9446 2.71739L18.2982 9.48861C18.4356 9.88368 18.8043 10.1516 19.2224 10.1601L26.3896 10.3061C27.3375 10.3254 27.7289 11.53 26.9733 12.1028L21.2609 16.4337C20.9276 16.6864 20.7867 17.1198 20.9078 17.5201L22.9837 24.3816C23.2583 25.2891 22.2336 26.0336 21.4554 25.492L15.5712 21.3975C15.2279 21.1586 14.7721 21.1586 14.4288 21.3975L8.54463 25.492C7.76639 26.0336 6.74174 25.2891 7.01629 24.3816L9.09216 17.5201C9.21327 17.1198 9.07245 16.6864 8.73915 16.4337L3.02666 12.1028C2.27112 11.53 2.6625 10.3254 3.61043 10.3061L10.7776 10.1601C11.1957 10.1516 11.5644 9.88368 11.7018 9.48861L14.0554 2.71739Z";

// Sample Rater uses the same bar shape but renders star icons instead of text.
// 1-star rows appear at the bottom, 5-star rows at the top.
const SampleRaterAnswerBar = ({ x, y, width, height, payload }) => {
  const clipId = `samplerater-clip-${payload.answer.replace(/\s+/g, "-")}`;
  const isAverage = !!payload.isAverageBucket;
  const starCount = Number(payload.starValue) || 0;

  // Fill: solid black for highlighted row, translucent gray otherwise
  const barFill = isAverage ? "rgba(0,0,0,1)" : "rgba(0,0,0,0.25)";

  // Star color: white on highlighted bar; black on non-highlighted bar
  const starFill = isAverage ? "#FFFFFF" : "#000000";

  // Size and spacing: keep stars at a consistent, modest spacing
  const verticalPadding = height * 0.15;
  const starSize = Math.min(height - 2 * verticalPadding, 22); // max ~22px tall
  const gap = 6; // fixed gap between stars for a stable, readable pattern

  // Left-align the star cluster with a modest inset
  const clusterWidth =
    starCount > 0 ? starCount * starSize + (starCount - 1) * gap : 0;
  const startX = x + 16; // fixed left padding inside bar
  const starY = y + (height - starSize) / 2; // vertically center stars

  return (
    <g>
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

      {/* Bar background */}
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx={12}
        fill={barFill}
      />

      {/* Star icons clipped to bar */}
      <g clipPath={`url(#${clipId})`} style={{ pointerEvents: "none" }}>
        {Array.from({ length: starCount }).map((_, idx) => {
          const sx = startX + idx * (starSize + gap);
          return (
            <svg
              key={idx}
              x={sx}
              y={starY}
              width={starSize}
              height={starSize}
              viewBox="0 0 30 30"
            >
              <path d={STAR_PATH_D} fill={starFill} />
            </svg>
          );
        })}
      </g>
    </g>
  );
};

export function GlowingBarVerticalChart({ analyticsData = {} }) {
  const hasQuestions = analyticsData && analyticsData.questions;
  const hasRatings =
    analyticsData &&
    analyticsData.ratingBuckets &&
    analyticsData.averageRating != null;

  // Nothing to render if we don't recognize the analytics shape
  if (!hasQuestions && !hasRatings) return null;

  // Sample Rater rating-distribution mode (1–5 stars)
  if (hasRatings && !hasQuestions) {
    const ratingBuckets = analyticsData.ratingBuckets || {};
    const average = Number(analyticsData.averageRating);
    const averageLabel = Number.isFinite(average) ? average.toFixed(1) : "—";

    // Highlight the bar corresponding to the rounded average rating
    const rounded = Math.round(average);
    const highlightStars = Math.min(5, Math.max(1, rounded));

    // Reverse order so 5 stars is at the top and 1 star at the bottom
    const chartData = [5, 4, 3, 2, 1].map((stars) => ({
      answer: `${stars} star${stars === 1 ? "" : "s"}`,
      starValue: stars,
      count: ratingBuckets[stars] || 0,
      isAverageBucket: stars === highlightStars,
    }));

    const max = Math.max(
      ...chartData.map((d) => d.count),
      1 // guard against empty
    );

    return (
      <Card>
        {/* Match MC style: simple description header above chart */}
        <CardDescription>
        <div className="flex items-center justify-between pb-6 mt-auto">
        <span className="OpenText">Rating Distribution</span>
        <span className="font-sans font-light text-[28px] text-muted-foreground">
          Avg: {averageLabel}
        </span>
      </div>

          
            
        </CardDescription>
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
              {/* dotted background, reuse Sample Rater's orange */}
              <defs>
                <pattern
                  id="samplerater-dots"
                  x="0"
                  y="0"
                  width="10"
                  height="10"
                  patternUnits="userSpaceOnUse"
                >
                  <circle cx="2" cy="2" r="1.75" fill="rgb(210,164,120)" />
                </pattern>
              </defs>

              <rect
                x="0"
                y="0"
                width="100%"
                height="100%"
                fill="url(#samplerater-dots)"
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
                    formatter={(value, _name, item) => {
                      const label = item?.payload?.answer;
                      const count = value ?? 0;
                      return (
                        <span className="font-medium">
                          {count} user{count === 1 ? "" : "s"} selected {label}
                        </span>
                      );
                    }}
                  />
                }
              />

              <Bar
                dataKey="count"
                radius={12}
                barSize={44}
                fill="var(--chart-1)"
                shape={<SampleRaterAnswerBar />}
              />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    );
  }

  // Default multiple-choice question mode (existing behavior)
  return (
    <div className="space-y-10">
      {Object.entries(analyticsData.questions).map(
        ([questionId, question]) => {
          const chartData = Object.values(question.options).map((opt) => ({
            answer: opt.optionText,
            count: opt.count,
          }));

          const max = Math.max(
            ...chartData.map((d) => d.count),
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

'use client'

import { TrendingUp } from 'lucide-react'
import { Label, PolarRadiusAxis, RadialBar, RadialBarChart } from 'recharts'

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from 'ui'
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from 'ui'

export const description = 'A radial chart with stacked sections'

const chartData = [{ month: 'january', diskUsed: 58, diskLeft: 20 }]

const chartConfig = {
  diskUsed: {
    label: 'Disk space used',
    color: 'hsl(var(--foreground-default))',
  },
  diskLeft: {
    label: 'Disk space available',
    color: 'hsl(var(--foreground-muted))',
  },
} satisfies ChartConfig

export function DiskUsageChart() {
  const percentageDiskUsed =
    (chartData[0].diskUsed / (chartData[0].diskUsed + chartData[0].diskLeft)) * 100

  //   chartData[0].diskUsed + chartData[0].diskLeft

  return (
    <div className="relative w-[128px] h-[80px]">
      <ChartContainer
        config={chartConfig}
        className="absolute mx-auto w-full max-w-[128px] flex items-center justify-center min-h-[128px]"
      >
        <RadialBarChart
          data={chartData}
          endAngle={0}
          startAngle={180}
          innerRadius={64}
          outerRadius={58}
          className="overflow-visible"
        >
          <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
          <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
            <Label
              content={({ viewBox }) => {
                if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                  return (
                    <>
                      <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle">
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) - 16}
                          className="fill-foreground text-2xl"
                        >
                          {Math.round(percentageDiskUsed).toLocaleString()}
                          <tspan className="text-sm">%</tspan>
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 4}
                          className="fill-foreground-lighter"
                        >
                          Disk space used
                        </tspan>
                      </text>
                    </>
                  )
                }
              }}
            />
          </PolarRadiusAxis>
          <RadialBar
            dataKey="diskUsed"
            stackId="a"
            cornerRadius={5}
            fill="var(--color-diskUsed)"
            className="stroke-transparent stroke-2"
          />
          <RadialBar
            dataKey="diskLeft"
            fill="var(--color-diskLeft)"
            stackId="a"
            cornerRadius={5}
            className="stroke-transparent stroke-2"
          />
        </RadialBarChart>
      </ChartContainer>
    </div>
  )
}

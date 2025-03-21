'use client'

import * as React from 'react'
import { Label, Pie, PieChart, Sector } from 'recharts'
import { PieSectorDataItem } from 'recharts/types/polar/Pie'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from 'ui'
import { ChartConfig, ChartContainer, ChartStyle, ChartTooltip, ChartTooltipContent } from 'ui'
import {
  Select_Shadcn_,
  SelectContent_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
} from 'ui'

export const description = 'An interactive pie chart'

const desktopData = [
  'january',
  'february',
  'march',
  'april',
  'may',
].map((month, index) => ({
  month,
  desktop: [186, 305, 237, 173, 209][index],
  fill: `var(--color-${month})`,
}))

const chartConfig = Object.fromEntries(
  ['january', 'february', 'march', 'april', 'may'].map((month, index) => [
    month,
    { label: month.charAt(0).toUpperCase() + month.slice(1), color: `hsl(var(--chart-${index + 1}))` },
  ])
) satisfies ChartConfig

export default function Component() {
  const id = 'pie-interactive'
  const [activeMonth, setActiveMonth] = React.useState(desktopData[0].month)

  const activeIndex = React.useMemo(
    () => desktopData.findIndex((item) => item.month === activeMonth),
    [activeMonth]
  )

  return (
    <Card data-chart={id} className="flex flex-col">
      <ChartStyle id={id} config={chartConfig} />
      <CardHeader className="flex-row items-start space-y-0 pb-0">
        <div className="grid gap-1">
          <CardTitle>Pie Chart - Interactive</CardTitle>
          <CardDescription>January - June 2024</CardDescription>
        </div>
        <Select_Shadcn_ value={activeMonth} onValueChange={setActiveMonth}>
          <SelectTrigger_Shadcn_ className="ml-auto h-7 w-[130px] rounded-lg pl-2.5" aria-label="Select a value">
            <SelectValue_Shadcn_ placeholder="Select month" />
          </SelectTrigger_Shadcn_>
          <SelectContent_Shadcn_ align="end" className="rounded-xl">
            {desktopData.map(({ month }) => (
              <SelectItem_Shadcn_ key={month} value={month} className="rounded-lg [&_span]:flex">
                <div className="flex items-center gap-2 text-xs">
                  <span className="flex h-3 w-3 shrink-0 rounded-sm" style={{ backgroundColor: `var(--color-${month})` }} />
                  {chartConfig[month].label}
                </div>
              </SelectItem_Shadcn_>
            ))}
          </SelectContent_Shadcn_>
        </Select_Shadcn_>
      </CardHeader>
      <CardContent className="flex flex-1 justify-center pb-0">
        <ChartContainer id={id} config={chartConfig} className="mx-auto aspect-square w-full max-w-[300px]">
          <PieChart>
            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
            <Pie
              data={desktopData}
              dataKey="desktop"
              nameKey="month"
              innerRadius={60}
              strokeWidth={5}
              activeIndex={activeIndex}
              activeShape={({ outerRadius = 0, ...props }: PieSectorDataItem) => (
                <g>
                  <Sector {...props} outerRadius={outerRadius + 10} />
                  <Sector {...props} outerRadius={outerRadius + 25} innerRadius={outerRadius + 12} />
                </g>
              )}
            >
              <Label
                content={({ viewBox }) =>
                  viewBox && 'cx' in viewBox && 'cy' in viewBox ? (
                    <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                      <tspan x={viewBox.cx} y={viewBox.cy} className="fill-foreground text-3xl font-bold">
                        {desktopData[activeIndex].desktop.toLocaleString()}
                      </tspan>
                      <tspan x={viewBox.cx} y={viewBox.cy + 24} className="fill-muted-foreground">
                        Visitors
                      </tspan>
                    </text>
                  ) : null
                }
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

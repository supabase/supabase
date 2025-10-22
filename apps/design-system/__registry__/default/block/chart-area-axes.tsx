'use client'

import { TrendingUp } from 'lucide-react'
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from 'ui'
import { ChartConfig, ChartContainer, ChartTooltipContent } from 'ui'

// Constants for colors
const mobileColor = 'var(--color-mobile)';
const desktopColor = 'var(--color-desktop)';

const chartData = [
  { month: 'January', desktop: 186, mobile: 80 },
  { month: 'February', desktop: 305, mobile: 200 },
  { month: 'March', desktop: 237, mobile: 120 },
  { month: 'April', desktop: 73, mobile: 190 },
  { month: 'May', desktop: 209, mobile: 130 },
  { month: 'June', desktop: 214, mobile: 140 },
]

const chartConfig: ChartConfig = {
  desktop: {
    label: 'Desktop',
    color: desktopColor,
  },
  mobile: {
    label: 'Mobile',
    color: mobileColor,
  },
}

export default function Component() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Area Chart - Axes</CardTitle>
        <CardDescription>Showing total visitors for the last 6 months</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart
              data={chartData}
              margin={{
                left: -20,
                right: 12,
              }}
            >
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value) => value.slice(0, 3)}
              />
              <YAxis tickLine={false} axisLine={false} tickMargin={8} tickCount={3} />
              <Tooltip cursor={false} content={<ChartTooltipContent />} />
              <Area
                dataKey="mobile"
                type="natural"
                fill={mobileColor}
                fillOpacity={0.4}
                stroke={mobileColor}
                stackId="a"
              />
              <Area
                dataKey="desktop"
                type="natural"
                fill={desktopColor}
                fillOpacity={0.4}
                stroke={desktopColor}
                stackId="a"
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
      <CardFooter>
        <div className="flex w-full items-start gap-2 text-sm">
          <div className="grid gap-2">
            <div className="flex items-center gap-2 font-medium leading-none">
              Trending up by 5.2% this month <TrendingUp className="h-4 w-4" />
            </div>
            <div className="flex items-center gap-2 leading-none text-muted-foreground">
              January - June 2024
            </div>
          </div>
        </div>
      </CardFooter>
    </Card>
  )
}

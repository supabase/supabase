'use client'

// import { Bar, BarChart, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
// import { ChartContainer } from 'ui'

import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis, Cell } from 'recharts'

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from 'ui'
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from 'ui'

export const description = 'A bar chart with a custom label'

// const chartData = [
//   { month: "January", desktop: 186, mobile: 80 },
//   { month: "February", desktop: 305, mobile: 200 },
//   { month: "March", desktop: 237, mobile: 120 },
//   { month: "April", desktop: 73, mobile: 190 },
//   { month: "May", desktop: 209, mobile: 130 },
//   { month: "June", desktop: 214, mobile: 140 },
// ]

const chartData = [
  { label: '1–10', value: 91.1 },
  { label: '11–50', value: 6.3 },
  { label: '51–100', value: 1.2 },
  { label: '101–250', value: 0.8 },
  { label: '250+', value: 0.6 },
]

const chartConfig = {
  value: {
    label: 'Value',
    color: 'hsl(var(--brand-default))',
  },
  label: {
    color: '#ff0000',
  },
} satisfies ChartConfig

export function FullTimeEmployees() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>How many full-time employees does your startup have?</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart
            accessibilityLayer
            data={chartData}
            layout="vertical"
            margin={{
              right: 0,
            }}
          >
            <CartesianGrid horizontal={false} />
            <YAxis
              dataKey="label"
              type="category"
              tickLine={false}
              tickMargin={64}
              axisLine={false}
              // tickFormatter={(value) => value.slice(0, 3)}
              hide={false} // Show the YAxis
              width={64} // Adjust width as needed for your labels
              tick={{
                // fill: 'hsl(var(--foreground-lighter))', // Text color TODO not working
                className: 'text-foreground-lighter', // Also not accessible
                fontSize: 12,
                textAnchor: 'start', // Left align
                dx: 0, // Horizontal offset
              }}
            />
            <XAxis dataKey="value" type="number" hide />
            {/* <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="line" />}
            /> */}
            <Bar dataKey="value" layout="vertical" radius={4}>
              {/* To set per-bar colors in Recharts, `fill` should be applied to the Cell child */}
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={index === 0 ? 'hsl(var(--brand-default))' : 'hsl(var(--brand-300))'}
                />
              ))}
              <LabelList
                dataKey="value"
                position="right"
                offset={8}
                className="fill-foreground"
                fontSize={12}
                formatter={(value: number) => `${value}%`}
              />
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

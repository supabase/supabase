'use client'

// import { Bar, BarChart, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
// import { ChartContainer } from 'ui'

import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from 'recharts'

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

export function BarChartNumbersTop() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Bar Chart - Custom Label</CardTitle>
        <CardDescription>January - June 2024</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart
            accessibilityLayer
            data={chartData}
            layout="vertical"
            barCategoryGap={32} // or try 24, 40, etc.
            barGap={8}
            margin={{
              right: 16,
            }}
          >
            <CartesianGrid horizontal={false} />
            <YAxis
              dataKey="label"
              type="category"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              // tickFormatter={(value) => value.slice(0, 3)}
              hide
            />
            <XAxis dataKey="value" type="number" hide />
            {/* <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="line" />}
            /> */}
            <Bar dataKey="value" layout="vertical" fill="var(--color-desktop)" radius={4}>
              <LabelList
                dataKey="label"
                content={(props) => {
                  // For vertical BarChart, x is the left of the bar, y is the top of the bar
                  const { x, y, width, value, index } = props
                  // x: left of bar, y: top of bar, width: bar width
                  // Center the label horizontally above the bar
                  return (
                    <text
                      x={0}
                      y={y - 8} // 8px above the bar
                      textAnchor="left"
                      fontSize={12}
                      className="fill-(--color-label)"
                    >
                      {value}
                    </text>
                  )
                }}
              />
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
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="flex gap-2 leading-none font-medium">Showing company size distribution</div>
        <div className="text-muted-foreground leading-none">Based on latest survey data</div>
      </CardFooter>
    </Card>
  )
}

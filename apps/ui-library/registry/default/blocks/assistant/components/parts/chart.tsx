'use client'

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/registry/default/components/ui/card'
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/registry/default/components/ui/chart'
import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts'

export type ChartDataPoint = Record<string, string | number>

export type ChartProps = {
  primaryText: string
  secondaryText?: string
  tertiaryText?: string
  data: ChartDataPoint[]
  xAxis: string
  yAxis: string
}

export function Chart({
  primaryText,
  secondaryText,
  tertiaryText,
  data,
  xAxis,
  yAxis,
}: ChartProps) {
  if (!data.length) return null

  const chartConfig = {
    [yAxis]: {
      label: yAxis,
      color: 'var(--chart-1)',
    },
  } satisfies ChartConfig

  const fillColor = `var(--color-${yAxis}, var(--chart-1))`

  return (
    <Card>
      <CardHeader>
        <CardTitle>{primaryText}</CardTitle>
        {secondaryText ? <CardDescription>{secondaryText}</CardDescription> : null}
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart accessibilityLayer data={data}>
            <CartesianGrid vertical={false} />
            <XAxis
              axisLine={false}
              dataKey={xAxis}
              tickFormatter={(value) => String(value).slice(0, 3)}
              tickLine={false}
              tickMargin={10}
            />
            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
            <Bar dataKey={yAxis} fill={fillColor} radius={8} />
          </BarChart>
        </ChartContainer>
      </CardContent>
      {(tertiaryText ?? null) ? (
        <CardFooter className="flex-col items-start gap-2 text-sm">
          <div className="text-muted-foreground leading-none">{tertiaryText}</div>
        </CardFooter>
      ) : null}
    </Card>
  )
}

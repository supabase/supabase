'use client'

import { AlertTriangle } from 'lucide-react'
import * as React from 'react'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'

import { Alert, AlertDescription, AlertTitle } from '@/registry/default/components/ui/alert'
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/registry/default/components/ui/chart'
import { Skeleton } from '@/registry/default/components/ui/skeleton'
import { useGetUserCountsByDay } from '@/registry/default/platform/platform-kit-nextjs/hooks/use-user-counts'

const chartConfig = {
  users: {
    label: 'New Users',
    color: 'var(--chart-1)',
  },
} satisfies ChartConfig

export function UsersGrowthChart({
  projectRef,
  timeRange,
}: {
  projectRef: string
  timeRange: number
}) {
  const { data: chartData, isLoading, isError } = useGetUserCountsByDay(projectRef, timeRange)

  return (
    <div>
      {isLoading && <Skeleton className="h-[250px] w-full" />}
      {isError && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error loading chart data</AlertTitle>
          <AlertDescription>There was a problem loading your chart data.</AlertDescription>
        </Alert>
      )}
      {chartData && !isLoading && (
        <ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">
          <BarChart
            accessibilityLayer
            data={chartData}
            margin={{
              left: -24,
              right: 12,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value)
                return date.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })
              }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickCount={5}
              allowDecimals={false}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  className="w-[150px]"
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })
                  }}
                  indicator="dot"
                />
              }
            />
            <Bar dataKey="users" fill="var(--color-users)" />
          </BarChart>
        </ChartContainer>
      )}
    </div>
  )
}

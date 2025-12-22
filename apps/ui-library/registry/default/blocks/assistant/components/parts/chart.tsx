'use client'

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/registry/default/components/ui/card'

export type ChartDataPoint = Record<string, string | number>

export type ChartProps = {
  primaryText?: string
  secondaryText?: string
  tertiaryText?: string
  data?: ChartDataPoint[]
  xAxis?: string
  yAxis?: string
}

export function Chart({
  primaryText,
  secondaryText,
  tertiaryText,
  data,
  xAxis,
  yAxis,
}: ChartProps) {
  // Don't render if we don't have the minimum required data
  const hasMinimumData = Boolean(data && data.length > 0 && xAxis && yAxis)

  // Calculate max value for normalization
  const maxValue =
    hasMinimumData && data && yAxis
      ? Math.max(...data.map((point) => Number(point[yAxis]) || 0))
      : 0

  return (
    <Card>
      <CardHeader>
        {primaryText ? <CardTitle>{primaryText}</CardTitle> : null}
        {secondaryText ? <CardDescription>{secondaryText}</CardDescription> : null}
      </CardHeader>
      {hasMinimumData && data && xAxis && yAxis ? (
        <CardContent>
          <div className="flex items-end gap-2 h-[200px] w-full">
            {data.map((point, index) => {
              const value = Number(point[yAxis]) || 0
              const heightPercentage = maxValue > 0 ? (value / maxValue) * 100 : 0
              const label = String(point[xAxis] || '').slice(0, 3)

              return (
                <div key={index} className="flex-1 flex flex-col items-center gap-2 h-full">
                  <div className="w-full flex items-end justify-center flex-1">
                    <div
                      className="w-full rounded-lg bg-chart-1 min-h-[4px]"
                      style={{ height: `${heightPercentage}%` }}
                    />
                  </div>
                  <div className="text-xs text-muted-foreground text-center">{label}</div>
                </div>
              )
            })}
          </div>
        </CardContent>
      ) : (
        <CardContent>
          <div className="flex items-center justify-center h-[200px] text-muted-foreground">
            Loading chart data...
          </div>
        </CardContent>
      )}
      {tertiaryText ? (
        <CardFooter className="flex-col items-start gap-2 text-sm">
          <div className="text-muted-foreground">{tertiaryText}</div>
        </CardFooter>
      ) : null}
    </Card>
  )
}

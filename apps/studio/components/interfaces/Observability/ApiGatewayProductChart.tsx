'use client'

import dayjs from 'dayjs'
import { ReactNode, useState } from 'react'
import { Bar, Cell, BarChart as RechartBarChart, XAxis, YAxis, type TooltipProps } from 'recharts'
import type { CategoricalChartState } from 'recharts/types/chart/types'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from 'ui'

import {
  API_GATEWAY_PRODUCT_KEYS,
  type ApiGatewayProductDatum,
  type ApiGatewayProductKey,
} from './apiGatewayProductChart.utils'

const PRODUCT_CONFIG: Record<ApiGatewayProductKey, { label: string; color: string }> = {
  db: { label: 'Database', color: 'hsl(var(--chart-1))' },
  postgrest: { label: 'PostgREST', color: 'hsl(var(--chart-2))' },
  auth: { label: 'Auth', color: 'hsl(var(--chart-3))' },
  functions: { label: 'Edge Functions', color: 'hsl(var(--chart-4))' },
  storage: { label: 'Storage', color: 'hsl(var(--chart-5))' },
  realtime: { label: 'Realtime', color: 'hsl(var(--chart-blue))' },
}

const ApiGatewayChartTooltip = ({
  active,
  payload,
  label,
  dateTimeFormat,
}: TooltipProps<number, string> & { dateTimeFormat: string }) => {
  if (!active || !payload || payload.length === 0) {
    return null
  }

  const nonZeroPayload = payload.filter((item) => Number(item.value) !== 0)
  if (nonZeroPayload.length === 0) {
    return null
  }

  return (
    <ChartTooltipContent
      active={active}
      payload={nonZeroPayload}
      label={label}
      className="text-foreground-light -mt-5 transition-none!"
      labelFormatter={(value: string) => dayjs(value).format(dateTimeFormat)}
    />
  )
}

export const ApiGatewayProductChart = ({
  data,
  onBarClick,
  EmptyState,
  DateTimeFormat = 'MMM D, YYYY, hh:mma',
  hideDateRange = false,
  hideXAxis = false,
}: {
  data: ApiGatewayProductDatum[]
  onBarClick?: (datum: ApiGatewayProductDatum) => void
  EmptyState?: ReactNode
  DateTimeFormat?: string
  hideDateRange?: boolean
  hideXAxis?: boolean
}) => {
  const [focusDataIndex, setFocusDataIndex] = useState<number | null>(null)

  if (data.length === 0) {
    if (EmptyState) return EmptyState
    return null
  }

  const startDate = dayjs(data[0]?.timestamp).format(DateTimeFormat)
  const endDate = dayjs(data[data.length - 1]?.timestamp).format(DateTimeFormat)

  return (
    <div data-testid="api-gateway-product-chart" className="flex flex-col gap-y-3 h-full">
      <ChartContainer className="h-full" config={PRODUCT_CONFIG}>
        <RechartBarChart
          data={data}
          onMouseMove={(e: CategoricalChartState) => {
            if (e.activeTooltipIndex !== focusDataIndex) {
              setFocusDataIndex(e.activeTooltipIndex ?? null)
            }
          }}
          onMouseLeave={() => setFocusDataIndex(null)}
          onClick={(tooltipData) => {
            const datum = tooltipData?.activePayload?.[0]?.payload
            if (onBarClick && datum) onBarClick(datum)
          }}
        >
          <YAxis tick={false} width={0} axisLine={false} tickLine={false} />
          <XAxis
            dataKey="timestamp"
            interval={data.length - 2}
            tick={false}
            axisLine={false}
            tickLine={false}
            {...(hideXAxis ? { height: 1 } : {})}
          />
          <ChartTooltip
            animationDuration={0}
            position={{ y: 16 }}
            content={<ApiGatewayChartTooltip dateTimeFormat={DateTimeFormat} />}
          />

          {API_GATEWAY_PRODUCT_KEYS.map((productKey) => {
            const color = PRODUCT_CONFIG[productKey].color
            return (
              <Bar
                key={productKey}
                dataKey={productKey}
                fill={color}
                maxBarSize={24}
                stackId="stack"
              >
                {data.map((_entry, index) => (
                  <Cell
                    className="cursor-pointer transition-opacity"
                    key={`${productKey}-${index}`}
                    fill={color}
                    fillOpacity={focusDataIndex === index || focusDataIndex === null ? 1 : 0.5}
                  />
                ))}
              </Bar>
            )
          })}
        </RechartBarChart>
      </ChartContainer>
      {!hideDateRange && (
        <div className="text-foreground-lighter -mt-10 flex items-center justify-between text-[10px] font-mono">
          <span>{startDate}</span>
          <span>{endDate}</span>
        </div>
      )}
    </div>
  )
}

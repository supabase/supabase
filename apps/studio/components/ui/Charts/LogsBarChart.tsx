import dayjs from 'dayjs'
import { useState } from 'react'
import { Bar, Cell, BarChart as RechartBarChart, Tooltip, XAxis, YAxis } from 'recharts'
import { CHART_COLORS, DateTimeFormats } from 'components/ui/Charts/Charts.constants'
import type { CategoricalChartState } from 'recharts/types/chart/types'
import type { Datum } from './Charts.types'
import { numberFormatter, useChartSize } from './Charts.utils'
import NoDataPlaceholder from './NoDataPlaceholder'
import { cn } from 'ui'

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.[0]) return null

  const errorCount = payload[0]?.payload.error_count
  const okCount = payload[0]?.payload.ok_count
  const timestamp = payload[0]?.payload.timestamp

  const date = dayjs(timestamp).format(DateTimeFormats.FULL)

  return (
    <div className="rounded-md bg-alternative p-2 shadow-lg text-[10px] font-mono">
      <div className="flex flex-col gap-y-0.5">
        <div className="text-foreground-light">{date}</div>
        <div className="text-foreground">Success: {numberFormatter(okCount)}</div>
        <div className="">Errors: {numberFormatter(errorCount)}</div>
        <div className="text-foreground-light">Total: {numberFormatter(okCount + errorCount)}</div>
      </div>
    </div>
  )
}

export const LogsBarChart = ({
  data,
  onBarClick,
}: {
  data: Datum[]
  onBarClick?: (datum: Datum, tooltipData?: CategoricalChartState) => void
}) => {
  const SIZE = 'tiny'
  const { Container } = useChartSize(SIZE)
  const [focusDataIndex, setFocusDataIndex] = useState<number | null>(null)

  if (data.length === 0) {
    return (
      <NoDataPlaceholder
        message={'No data'}
        description="It may take up to 24 hours for data to refresh"
        size={SIZE}
      />
    )
  }

  const startDate = dayjs(data[0]['timestamp']).format(DateTimeFormats.FULL)
  const endDate = dayjs(data[data?.length - 1]?.['timestamp']).format(DateTimeFormats.FULL)

  return (
    <div className={cn('flex flex-col gap-y-3')}>
      <Container>
        <RechartBarChart
          data={data}
          onMouseMove={(e: any) => {
            if (e.activeTooltipIndex !== focusDataIndex) {
              setFocusDataIndex(e.activeTooltipIndex)
            }
          }}
          onMouseLeave={() => setFocusDataIndex(null)}
          onClick={(tooltipData) => {
            const datum = tooltipData?.activePayload?.[0]?.payload
            if (onBarClick) onBarClick(datum, tooltipData)
          }}
        >
          <YAxis
            tick={false}
            width={0}
            axisLine={{ stroke: CHART_COLORS.AXIS }}
            tickLine={{ stroke: CHART_COLORS.AXIS }}
          />
          <XAxis
            interval={data.length - 2}
            tick={false}
            axisLine={{ stroke: CHART_COLORS.AXIS }}
            tickLine={{ stroke: CHART_COLORS.AXIS }}
          />
          <Tooltip
            wrapperStyle={{
              top: -24,
            }}
            content={<CustomTooltip />}
          />

          {/* Error bars */}
          <Bar dataKey="error_count" fill={CHART_COLORS.RED_1} maxBarSize={24} stackId="stack">
            {data?.map((_entry: Datum, index: number) => (
              <Cell
                className="cursor-pointer transition-colors"
                key={`error-${index}`}
                fill={
                  focusDataIndex === index || focusDataIndex === null
                    ? CHART_COLORS.RED_1
                    : CHART_COLORS.RED_2
                }
              />
            ))}
          </Bar>

          {/* Success bars */}
          <Bar dataKey="ok_count" fill={CHART_COLORS.GREEN_1} maxBarSize={24} stackId="stack">
            {data?.map((_entry: Datum, index: number) => (
              <Cell
                className="cursor-pointer transition-colors"
                key={`success-${index}`}
                fill={
                  focusDataIndex === index || focusDataIndex === null
                    ? CHART_COLORS.GREEN_1
                    : CHART_COLORS.GREEN_2
                }
              />
            ))}
          </Bar>
        </RechartBarChart>
      </Container>
      {data && (
        <div className="text-foreground-lighter -mt-10 flex items-center justify-between text-[10px] font-mono">
          <span>{startDate}</span>
          <span>{endDate}</span>
        </div>
      )}
    </div>
  )
}

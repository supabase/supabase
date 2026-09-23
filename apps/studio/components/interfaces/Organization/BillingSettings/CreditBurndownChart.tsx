import dayjs from 'dayjs'
import { TrendingDown } from 'lucide-react'
import { useMemo, useState } from 'react'
import { cn, type ChartConfig } from 'ui'
import {
  Chart,
  ChartCard,
  ChartContent,
  ChartEmptyState,
  ChartHeader,
  ChartLine,
  ChartLoadingState,
  ChartTitle,
  type ChartLineTick,
} from 'ui-patterns/Chart'

import {
  aggregateBurndownData,
  deriveBurndownAggregation,
  formatBurndownCurrencyCompact,
  formatBurndownCurrencySigned,
  getBurndownBreakdownTotals,
  getBurndownMinDate,
  getDefaultBurndownRange,
  mapBurndownResponse,
  type BurndownAggregation,
  type BurndownDataPoint,
} from './CreditBurndownChart.utils'
import { CreditBurndownDateRangePicker } from './CreditBurndownDateRangePicker'
import { AlertError } from '@/components/ui/AlertError'
import { useOrgCreditsBurndownQuery } from '@/data/subscriptions/org-credits-burndown-query'

const chartConfig: ChartConfig = {
  balance: { label: 'Remaining balance', color: 'hsl(var(--brand-default))' },
}

const DATE_FORMAT: Record<BurndownAggregation, string> = {
  day: 'MMM D, YYYY',
  week: 'MMM D, YYYY',
}

// Fixed categorical palette for the breakdown legend/tooltip. Colors are
// assigned by hashing the category key, so a given category always gets the
// same color regardless of which other categories are present in a given
// day's breakdown or in the legend totals.
const CATEGORY_SWATCH_PALETTE = [
  'bg-blue-900',
  'bg-green-800',
  'bg-orange-800',
  'bg-purple-900',
  'bg-yellow-800',
  'bg-teal-700',
  'bg-red-800',
]

const getCategorySwatchClass = (key: string) => {
  let hash = 0
  for (let i = 0; i < key.length; i++) {
    hash = (hash << 5) - hash + key.charCodeAt(i)
    hash |= 0
  }
  return CATEGORY_SWATCH_PALETTE[Math.abs(hash) % CATEGORY_SWATCH_PALETTE.length]
}

const renderBurndownTooltipDetails = (datum: ChartLineTick, key: string) => {
  if (key !== 'balance') return null
  return <BreakdownTooltip breakdown={(datum as unknown as BurndownDataPoint).breakdown} />
}

const BreakdownTooltip = ({ breakdown }: { breakdown: BurndownDataPoint['breakdown'] }) => {
  const items = breakdown.filter((item) => item.amount !== 0)
  if (items.length === 0) return null

  return (
    <div className="grid gap-0.5 mt-1">
      {items.map((item) => (
        <div key={item.key} className="flex items-center gap-1.5">
          <span
            className={cn('h-1.5 w-1.5 shrink-0 rounded-full', getCategorySwatchClass(item.key))}
          />
          <span className="flex flex-1 justify-between gap-4">
            <span className="text-foreground-lighter">{item.label}</span>
            <span className="font-mono tabular-nums text-foreground-lighter">
              {formatBurndownCurrencySigned(item.amount)}
            </span>
          </span>
        </div>
      ))}
    </div>
  )
}

// Only shows credits consumed (negative amounts) - credits added (top-ups)
// aren't part of the "burndown" this footer summarizes.
const BreakdownLegend = ({ totals }: { totals: BurndownDataPoint['breakdown'] }) => {
  const items = totals.filter((item) => item.amount < 0)
  if (items.length === 0) return null

  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 px-card py-3 border-t">
      {items.map((item) => (
        <div key={item.key} className="flex items-center gap-2">
          <span
            className={cn('h-2.5 w-2.5 shrink-0 rounded-sm', getCategorySwatchClass(item.key))}
          />
          <span className="text-xs text-foreground-light">{item.label}</span>
          <span className="text-xs font-mono tabular-nums text-foreground">
            {formatBurndownCurrencySigned(item.amount)}
          </span>
        </div>
      ))}
    </div>
  )
}

interface CreditBurndownChartProps {
  orgSlug: string | undefined
}

export const CreditBurndownChart = ({ orgSlug }: CreditBurndownChartProps) => {
  const [range, setRange] = useState(getDefaultBurndownRange)
  const minDate = useMemo(() => getBurndownMinDate(), [])

  const {
    data: response,
    error,
    isLoading,
    isError,
  } = useOrgCreditsBurndownQuery({
    orgSlug,
    startDate: dayjs(range.from).format('YYYY-MM-DD'),
    endDate: dayjs(range.to).format('YYYY-MM-DD'),
  })

  const aggregation = useMemo(
    () => deriveBurndownAggregation(range.from, range.to),
    [range.from, range.to]
  )

  const dailyData = useMemo(() => mapBurndownResponse(response?.data ?? []), [response])

  const data = useMemo(
    () => aggregateBurndownData(dailyData, aggregation),
    [dailyData, aggregation]
  )

  const breakdownTotals = useMemo(() => getBurndownBreakdownTotals(dailyData), [dailyData])

  return (
    <Chart isLoading={isLoading} isErrored={isError}>
      <ChartCard>
        <ChartHeader>
          <ChartTitle tooltip="Prepaid credit balance over time, broken down by the items that consumed credits.">
            Credit Burndown
          </ChartTitle>
          <CreditBurndownDateRangePicker
            from={range.from}
            to={range.to}
            minDate={minDate}
            onChange={setRange}
          />
        </ChartHeader>
        <ChartContent
          isEmpty={data.length === 0}
          loadingState={<ChartLoadingState />}
          errorState={
            <AlertError error={error ?? undefined} subject="Failed to retrieve credit burndown" />
          }
          emptyState={
            <ChartEmptyState
              icon={<TrendingDown size={16} />}
              title="No credit burndown to show"
              description="Prepaid credit usage will appear here once your projects start consuming credits in this date range"
            />
          }
        >
          <div className="h-56 px-card pb-card">
            <ChartLine
              data={data as unknown as ChartLineTick[]}
              dataKey="balance"
              config={chartConfig}
              DateTimeFormat={DATE_FORMAT[aggregation]}
              curveType="monotone"
              isFullHeight
              showGrid
              showYAxis
              YAxisProps={{
                tickFormatter: (value: number) => formatBurndownCurrencyCompact(value),
              }}
              tooltipDetails={renderBurndownTooltipDetails}
            />
          </div>
        </ChartContent>
        <BreakdownLegend totals={breakdownTotals} />
      </ChartCard>
    </Chart>
  )
}

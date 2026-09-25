import { ArrowUpRight } from 'lucide-react'
import Link from 'next/link'
import {
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogSection,
  DialogSectionSeparator,
  DialogTitle,
  Skeleton,
} from 'ui'

import { iso2ToCountryName } from '@/components/interfaces/Reports/utils/geo'
import {
  getGeographicUsagePeriod,
  useGeographicUsageTrendQuery,
  type GeographicUsageCountry,
  type GeographicUsageRange,
  type GeographicUsageTrendPoint,
} from '@/data/analytics/geographic-usage-query'

const getTrendPoints = (trend: GeographicUsageTrendPoint[]) => {
  const chartWidth = 640
  const chartHeight = 200
  const padding = 16
  const maxRequests = Math.max(...trend.map((point) => point.requests), 0)
  const minRequests = Math.min(...trend.map((point) => point.requests), 0)
  const range = Math.max(maxRequests - minRequests, 1)
  const width = chartWidth - padding * 2
  const height = chartHeight - padding * 2

  return trend
    .map((point, index) => {
      const x = trend.length > 1 ? padding + (index / (trend.length - 1)) * width : chartWidth / 2
      const y = padding + ((maxRequests - point.requests) / range) * height
      return `${x},${y}`
    })
    .join(' ')
}

const formatTrendDate = (value: string, range: GeographicUsageRange) => {
  const normalized = value.endsWith('Z') ? value : `${value}Z`
  const date = new Date(normalized)
  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    ...(range === '24h' ? { hour: 'numeric' as const } : {}),
    timeZone: 'UTC',
  }).format(date)
}

const CountryUsageTrendChart = ({
  countryName,
  range,
  trend,
}: {
  countryName: string
  range: GeographicUsageRange
  trend: GeographicUsageTrendPoint[]
}) => {
  if (trend.length === 0) {
    return (
      <div className="flex h-52 items-center justify-center rounded-md border text-sm text-foreground-lighter">
        No request trend is available for this period
      </div>
    )
  }

  const polylinePoints = getTrendPoints(trend)
  const firstDate = formatTrendDate(trend[0].timestamp, range)
  const lastDate = formatTrendDate(trend[trend.length - 1].timestamp, range)

  return (
    <div>
      <svg
        viewBox="0 0 640 200"
        className="h-52 w-full overflow-visible"
        role="img"
        aria-label={`${countryName} database requests from ${firstDate} to ${lastDate}`}
      >
        <line x1="16" y1="184" x2="624" y2="184" stroke="hsl(var(--border-default))" />
        <polyline
          points={polylinePoints}
          fill="none"
          stroke="hsl(var(--brand-default))"
          strokeWidth="3"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
      <div className="flex justify-between text-xs text-foreground-lighter">
        <span>{firstDate} UTC</span>
        <span>{lastDate} UTC</span>
      </div>
    </div>
  )
}

export const CountryUsageDetailsDialog = ({
  projectRef,
  country,
  totalRequests,
  range,
  onClose,
}: {
  projectRef?: string
  country: GeographicUsageCountry | undefined
  totalRequests: number
  range: GeographicUsageRange
  onClose: () => void
}) => {
  const {
    data: trend,
    isPending,
    isError,
  } = useGeographicUsageTrendQuery({
    projectRef,
    countryCode: country?.code,
    range,
  })

  const countryName = country ? iso2ToCountryName(country.code) : 'Country'
  const share = country && totalRequests > 0 ? (country.requests / totalRequests) * 100 : 0
  const period = getGeographicUsagePeriod(range)
  const logsQuery = new URLSearchParams({
    its: period.start.toISOString(),
    ite: period.end.toISOString(),
  })
  let changeLabel = 'No prior data'
  if (!country) changeLabel = '—'
  else if (country.change !== null) {
    const direction = country.change >= 0 ? '↑' : '↓'
    changeLabel = `${direction} ${Math.abs(country.change).toFixed(1)}%`
  }

  return (
    <Dialog
      open={country !== undefined}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogContent size="large">
        <DialogHeader>
          <DialogTitle>{countryName} requests</DialogTitle>
          <DialogDescription>
            Aggregated database request volume for the selected time range
          </DialogDescription>
        </DialogHeader>
        <DialogSectionSeparator />
        <DialogSection className="space-y-5">
          <div className="grid grid-cols-3 divide-x rounded-md border">
            <div className="space-y-1 p-4">
              <p className="text-xs text-foreground-lighter">Requests</p>
              <p className="text-xl font-medium text-foreground">
                {country?.requests.toLocaleString() ?? '—'}
              </p>
            </div>
            <div className="space-y-1 p-4">
              <p className="text-xs text-foreground-lighter">Share of total</p>
              <p className="text-xl font-medium text-foreground">{share.toFixed(1)}%</p>
            </div>
            <div className="space-y-1 p-4">
              <p className="text-xs text-foreground-lighter">Change</p>
              <p className="text-xl font-medium text-foreground">{changeLabel}</p>
            </div>
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between gap-4">
              <h3 className="text-sm font-medium text-foreground">Request trend</h3>
              <span className="text-xs text-foreground-lighter">
                {range === '24h' ? 'Requests per hour' : 'Requests per day'}
              </span>
            </div>
            {isPending && <Skeleton className="h-52 w-full" />}
            {isError && (
              <div className="flex h-52 items-center justify-center rounded-md border text-sm text-foreground-lighter">
                Unable to load request trend
              </div>
            )}
            {trend && !isError && (
              <CountryUsageTrendChart countryName={countryName} range={range} trend={trend} />
            )}
          </div>
        </DialogSection>
        <DialogFooter>
          {projectRef && (
            <Button asChild variant="outline">
              <Link href={`/project/${projectRef}/logs/edge-logs?${logsQuery.toString()}`}>
                View request logs <ArrowUpRight size={14} />
              </Link>
            </Button>
          )}
          <DialogClose asChild>
            <Button variant="primary">Back to results</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

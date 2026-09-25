import { useParams } from 'common'
import { Database } from 'lucide-react'
import { useState } from 'react'
import { Badge, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Skeleton } from 'ui'

import { AlertError } from '@/components/ui/AlertError'
import {
  useGeographicUsageQuery,
  type GeographicUsageRange,
} from '@/data/analytics/geographic-usage-query'

const RANGE_OPTIONS: { value: GeographicUsageRange; label: string }[] = [
  { value: '24h', label: 'Last 24 hours' },
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
]

const formatRequests = (value: number) => value.toLocaleString()

const formatPercent = (value: number) => `${value.toFixed(1)}%`

const formatUpdatedMinutesAgo = (timestamp: string) => {
  const minutesAgo = Math.max(0, Math.floor((Date.now() - new Date(timestamp).getTime()) / 60_000))
  return minutesAgo < 1 ? 'Just now' : `${minutesAgo} min ago`
}

const SummaryMetric = ({ label, value, note }: { label: string; value: string; note: string }) => (
  <div className="flex min-h-24 flex-col justify-center gap-1 border-r px-5 last:border-r-0 max-md:border-b max-md:odd:border-r max-md:even:border-r-0 max-md:[&:nth-last-child(-n+2)]:border-b-0">
    <span className="text-xs text-foreground-lighter">{label}</span>
    <strong className="text-2xl font-medium tracking-tight text-foreground">{value}</strong>
    <span className="text-xs text-foreground-lighter">{note}</span>
  </div>
)

const GeographicUsageLoading = () => (
  <div
    className="overflow-hidden rounded-lg border bg-surface-100"
    aria-label="Loading geographic usage"
  >
    <div className="grid grid-cols-4 max-md:grid-cols-2">
      {Array.from({ length: 4 }, (_, index) => (
        <div key={index} className="flex min-h-24 flex-col justify-center gap-2 border-r px-5">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
      ))}
    </div>
    <div className="grid min-h-[420px] grid-cols-[minmax(0,1.65fr)_minmax(18rem,0.7fr)] border-t max-lg:grid-cols-1">
      <Skeleton className="min-h-[420px] rounded-none" />
      <div className="space-y-4 p-4 max-lg:hidden">
        {Array.from({ length: 6 }, (_, index) => (
          <Skeleton key={index} className="h-12 w-full" />
        ))}
      </div>
    </div>
  </div>
)

export const GeographicUsageSection = () => {
  const { ref: projectRef } = useParams()
  const [range, setRange] = useState<GeographicUsageRange>('24h')
  const { data, isPending, isError, error } = useGeographicUsageQuery({
    projectRef,
    range,
  })

  return (
    <section aria-labelledby="geographic-usage-title" className="space-y-5">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-foreground-lighter">
            <Database size={14} /> Database
          </div>
          <div className="flex items-center gap-2">
            <h2 id="geographic-usage-title" className="text-xl font-medium text-foreground">
              Database usage by location
            </h2>
            <Badge variant="success">Beta</Badge>
          </div>
          <p className="mt-1 text-sm text-foreground-lighter">
            See where aggregated database requests originated during the selected period.
          </p>
        </div>

        <Select value={range} onValueChange={(value) => setRange(value as GeographicUsageRange)}>
          <SelectTrigger aria-label="Time range" className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent align="end">
            {RANGE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isPending && <GeographicUsageLoading />}
      {isError && (
        <AlertError subject="Failed to retrieve geographic database usage" error={error} />
      )}
      {data && (
        <div className="overflow-hidden rounded-lg border bg-surface-100">
          <div className="grid grid-cols-4 max-md:grid-cols-2">
            <SummaryMetric
              label="Total database requests"
              value={formatRequests(data.totalRequests)}
              note="During the selected period"
            />
            <SummaryMetric
              label="Located requests"
              value={formatPercent(data.coveragePercent)}
              note={`${formatRequests(data.locatedRequests)} requests`}
            />
            <SummaryMetric
              label="Countries with eligible data"
              value={String(data.eligibleCountryCount)}
              note={`Minimum ${data.minimumRequests} requests`}
            />
            <SummaryMetric
              label="Last updated"
              value={formatUpdatedMinutesAgo(data.lastUpdated)}
              note={`${new Intl.DateTimeFormat('en-US', {
                dateStyle: 'medium',
                timeStyle: 'short',
                timeZone: 'UTC',
              }).format(new Date(data.lastUpdated))} UTC`}
            />
          </div>

          <div className="flex min-h-[420px] items-center justify-center border-t bg-surface-100 text-sm text-foreground-lighter">
            Request volume by country
          </div>
        </div>
      )}
    </section>
  )
}

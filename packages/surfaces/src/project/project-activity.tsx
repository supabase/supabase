import { useState } from 'react'
import { ToggleGroup, ToggleGroupItem } from 'ui'
import {
  Chart,
  ChartBar,
  ChartCard,
  ChartContent,
  ChartEmptyState,
  ChartHeader,
  ChartLine,
  ChartLoadingState,
  ChartTitle,
  type ChartLineTick,
} from 'ui-patterns/Chart'

import type { Traffic } from '../contract'
import { compactNumber, fullNumber } from './project-format'

/** Hourly error rates at or above this are marked with a threshold line. */
export const ERROR_RATE_ALERT = 5

type Metric = 'requests' | 'errorRate'
const METRIC_LABELS: Record<Metric, string> = { requests: 'Requests', errorRate: 'Error rate' }
const isMetric = (value: string): value is Metric => value in METRIC_LABELS

const DATE_FORMAT = 'MMM D, HH:mm'

interface ProjectActivityProps {
  traffic: Traffic | undefined
  isLoading: boolean
  /** Why traffic is missing: a failed section, a failed load, or an unsupported connection. */
  unavailableMessage: string | undefined
}

const WINDOW_NOTE = 'Hourly API gateway traffic for the last 24 complete hours.'

/** What the chart covers, plus the error-rate caveat when some responses had no status. */
function activityNote(traffic: Traffic | undefined, metric: Metric) {
  if (metric !== 'errorRate' || !traffic || traffic.unknownStatus === 0) return WINDOW_NOTE
  return `${WINDOW_NOTE} ${fullNumber.format(traffic.unknownStatus)} requests have no valid status and are excluded from error rates.`
}

export function ProjectActivity({ traffic, isLoading, unavailableMessage }: ProjectActivityProps) {
  const [metric, setMetric] = useState<Metric>('requests')
  const isErrorRate = metric === 'errorRate'
  const hasNoStatuses = isErrorRate && traffic?.errorRate == null
  const hasNoRequests = traffic?.requests === 0
  const empty = (() => {
    if (unavailableMessage)
      return { title: 'Activity is unavailable', description: unavailableMessage }
    if (!traffic) return { title: 'Activity is unavailable', description: undefined }
    // Zero traffic is a reading to question, not a healthy flat line.
    if (hasNoRequests)
      return {
        title: 'No requests recorded',
        description: 'Check traffic and log capture before assessing health.',
      }
    if (hasNoStatuses)
      return { title: 'Activity is unavailable', description: 'No response statuses recorded.' }
    return undefined
  })()
  const note = activityNote(traffic, metric)

  const requestPoints = (traffic?.points ?? []).map(({ timestamp, requests }) => ({
    timestamp,
    requests,
  }))
  // Hours without a known status are gaps, never a 0% reading.
  const errorRatePoints = (traffic?.points ?? []).map(
    ({ timestamp, errorRate }): ChartLineTick =>
      errorRate == null ? { timestamp } : { timestamp, errorRate }
  )

  return (
    <section aria-labelledby="home-activity-title" aria-busy={isLoading}>
      <Chart isLoading={isLoading}>
        <ChartCard>
          <ChartHeader>
            <ChartTitle id="home-activity-title" tooltip={note}>
              Activity
            </ChartTitle>
            <ToggleGroup
              type="single"
              variant="segmented"
              size="tiny"
              tone="text"
              value={metric}
              allowDeselect={false}
              aria-label="Activity metric"
              onValueChange={(value) => {
                if (isMetric(value)) setMetric(value)
              }}
            >
              {(Object.keys(METRIC_LABELS) as Metric[]).map((key) => (
                <ToggleGroupItem key={key} value={key}>
                  {METRIC_LABELS[key]}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </ChartHeader>
          <ChartContent
            isEmpty={!!empty}
            loadingState={<ChartLoadingState className="h-44" />}
            emptyState={
              <ChartEmptyState
                className="h-44 px-4 text-center"
                title={empty?.title ?? ''}
                description={empty?.description}
              />
            }
          >
            <div
              role="img"
              aria-label={`${METRIC_LABELS[metric]} by hour. ${note}`}
              data-testid="activity-chart"
              className="h-44"
            >
              {!isErrorRate && (
                <ChartBar
                  isFullHeight
                  showGrid
                  showYAxis
                  data={requestPoints}
                  dataKey="requests"
                  config={{ requests: { label: 'Requests' } }}
                  DateTimeFormat={DATE_FORMAT}
                  YAxisProps={{ width: 48, tickFormatter: (n: number) => compactNumber.format(n) }}
                />
              )}
              {isErrorRate && (
                <ChartLine
                  isFullHeight
                  showGrid
                  showYAxis
                  data={errorRatePoints}
                  dataKey="errorRate"
                  config={{ errorRate: { label: 'Error rate (%)' } }}
                  DateTimeFormat={DATE_FORMAT}
                  YAxisProps={{
                    width: 48,
                    domain: [0, 'auto'],
                    tickFormatter: (n: number) => `${Number(n.toFixed(1))}%`,
                  }}
                  referenceLines={[
                    { y: ERROR_RATE_ALERT, stroke: 'hsl(var(--destructive-default))' },
                  ]}
                />
              )}
            </div>
          </ChartContent>
        </ChartCard>
      </Chart>
    </section>
  )
}

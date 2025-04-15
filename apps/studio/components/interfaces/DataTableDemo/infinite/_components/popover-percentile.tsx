'use client'
import { ColumnSchema } from '../schema'
import { FunctionSquare } from 'lucide-react'
import * as React from 'react'
import { cn } from 'ui'
import {
  formatCompactNumber,
  formatMilliseconds,
} from 'components/interfaces/DataTableDemo/lib/format'
import {
  Percentile,
  getPercentileColor,
} from 'components/interfaces/DataTableDemo/lib/request/percentile'
import {
  Popover_Shadcn_ as Popover,
  PopoverContent_Shadcn_ as PopoverContent,
  PopoverTrigger_Shadcn_ as PopoverTrigger,
} from 'ui'

interface PopoverPercentileProps {
  data?: ColumnSchema
  percentiles?: Record<Percentile, number>
  filterRows: number
  className?: string
}

export function PopoverPercentile({
  data,
  percentiles,
  filterRows,
  className,
}: PopoverPercentileProps) {
  let percentileArray = percentiles
    ? Object.entries(percentiles).map(([percentile, latency]) => [parseInt(percentile), latency])
    : []

  data?.percentile ? percentileArray.push([data.percentile, data.latency]) : null
  percentileArray.sort((a, b) => a[0] - b[0])

  return (
    <Popover>
      <PopoverTrigger
        className={cn(
          'font-mono flex items-center gap-1 rounded-md ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          className
        )}
      >
        <FunctionSquare
          className={cn(
            'h-4 w-4',
            data?.percentile ? getPercentileColor(data.percentile).text : 'text-muted-foreground'
          )}
        />
        {!data?.percentile ? 'N/A' : `P${Math.round(data.percentile)}`}
      </PopoverTrigger>
      <PopoverContent className="w-40 flex flex-col gap-2 p-2 text-xs" align="end">
        <p>
          Calculated from filtered result of{' '}
          <span className="font-medium font-mono">{formatCompactNumber(filterRows)}</span> rows.
        </p>
        <div className="flex flex-col gap-0.5">
          {percentileArray.map(([key, value]) => {
            const active = data?.percentile && data.percentile === key && value === data.latency
            return (
              <div
                key={`${key}-${value}`}
                className={cn(
                  'flex items-center justify-between px-1 py-0.5 rounded-md',
                  active && data.percentile
                    ? `border ${getPercentileColor(data.percentile).border}`
                    : null
                )}
              >
                <div
                  className={cn('font-mono', !active && 'text-muted-foreground')}
                >{`P${Math.round(key)}`}</div>
                <div className="font-mono">
                  {formatMilliseconds(Math.round(value))}
                  <span className="text-muted-foreground">ms</span>
                </div>
              </div>
            )
          })}
        </div>
      </PopoverContent>
    </Popover>
  )
}

import { type MouseEvent, type UIEvent } from 'react'
import DataGrid, { Row, type Column } from 'react-data-grid'
import { cn } from 'ui'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import AlertError from '@/components/ui/AlertError'
import type { CronJob } from '@/data/database-cron-jobs/database-cron-jobs-infinite-query'
import type { ResponseError } from '@/types'

interface CronJobsTabDataGridProps {
  columns: readonly Column<CronJob>[]
  rows: CronJob[]
  isLoading: boolean
  error: ResponseError | Error | null
  searchQuery?: string | null
  onScroll: (event: UIEvent<HTMLDivElement>) => void
  onRowClick: (row: CronJob, event: MouseEvent<HTMLDivElement>) => void
}

export const CronJobsTabDataGrid = ({
  columns,
  rows,
  isLoading,
  error,
  searchQuery,
  onScroll,
  onRowClick,
}: CronJobsTabDataGridProps) => {
  const fallbackContent = isLoading ? (
    <div className="absolute top-12 px-6 w-full">
      <GenericSkeletonLoader />
    </div>
  ) : error ? (
    <div className="absolute top-14 px-10 flex flex-col items-center justify-center w-full">
      <AlertError subject="Failed to retrieve cron jobs" error={error} />
    </div>
  ) : (
    <div className="absolute top-32 px-6 w-full">
      <div className="text-center text-sm flex flex-col gap-y-1">
        <p className="text-foreground">
          {!!searchQuery ? 'No cron jobs found' : 'No cron jobs in your project'}
        </p>
        <p className="text-foreground-light">
          {!!searchQuery
            ? 'There are currently no cron jobs based on the search applied'
            : 'There are currently no cron jobs created yet in your project'}
        </p>
      </div>
    </div>
  )

  return (
    <DataGrid
      className="grow border-t-0"
      rowHeight={44}
      headerRowHeight={36}
      columns={columns}
      rows={rows}
      onScroll={onScroll}
      rowKeyGetter={(row) => row.jobid}
      rowClass={() => {
        return cn(
          'cursor-pointer',
          '[&>.rdg-cell]:border-box [&>.rdg-cell]:outline-hidden [&>.rdg-cell]:shadow-none',
          '[&>.rdg-cell:first-child>div]:ml-8'
        )
      }}
      renderers={{
        renderRow(_, props) {
          return (
            <Row
              key={props.row.jobid}
              {...props}
              onClick={(event) => {
                onRowClick(props.row, event)
              }}
            />
          )
        },
        noRowsFallback: fallbackContent,
      }}
    />
  )
}

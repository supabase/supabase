import DataGrid, { Row, RowRendererProps } from '@supabase/react-data-grid'
import { isEqual } from 'lodash'
import { Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button, cn } from 'ui'

import { LogData } from './Events.types'
import LogSelection from './EventSelection'
import { ColumnRenderer } from './RealtimeEventColumnRenderer'

export const isErrorLog = (l: LogData) => {
  return l.event_message === 'SYSTEM' && l.metadata?.status === 'error'
}

interface Props {
  enabled: boolean
  data?: LogData[]
}

const renderNoResultAlert = () => (
  <div className="mt-16 flex scale-100 flex-col items-center justify-center gap-6 text-center opacity-100">
    <div className="flex flex-col gap-1">
      <div className="relative flex h-4 w-32 items-center rounded border border-dashed border-scale-600 px-2 dark:border-scale-900"></div>
      <div className="relative flex h-4 w-32 items-center rounded border border-dashed border-scale-600 px-2 dark:border-scale-900">
        <div className="absolute right-1 -bottom-4 text-scale-1100">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
      </div>
    </div>
    <div className="flex flex-col gap-1 px-5">
      <h3 className="text-lg text-scale-1200">No results</h3>
      <p className="text-sm text-scale-900">Try another search, or adjusting the filters</p>
    </div>
  </div>
)

const RowRenderer = (props: RowRendererProps<any>) => {
  return <Row {...props} isRowSelected={false} selectedCellIdx={undefined} />
}

const EventsTable = ({ enabled, data = [] }: Props) => {
  const [focusedLog, setFocusedLog] = useState<LogData | null>(null)
  const stringData = JSON.stringify(data)

  useEffect(() => {
    if (!data) return
    const found = data.find((datum) => datum.id === focusedLog?.id)
    if (!found) {
      setFocusedLog(null)
    }
  }, [stringData])

  if (!data) return null

  return (
    <>
      <section className="flex w-full flex-col" style={{ maxHeight: 'calc(100vh - 42px - 3rem)' }}>
        <div className="flex h-full flex-row">
          <div className="flex flex-grow flex-col">
            {enabled && (
              <div className="w-full h-12 px-4 bg-brand-400 border-b border-zinc-800 items-center inline-flex justify-between">
                <div className="inline-flex gap-2.5 text-brand-600 text-xs">
                  <Loader2 size="16" className="animate-spin" />
                  <div>Listening</div>
                  <div>•</div>
                  <div>
                    {data.length > 0
                      ? data.length >= 100
                        ? `Found a large number of events, showing only the latest 100...`
                        : `Found ${data.length} events...`
                      : `No event found yet...`}
                  </div>
                </div>
                <Button type="primary" className="!bg-brand-400 !border-brand-500">
                  Send test event
                </Button>
              </div>
            )}

            <DataGrid
              className="data-grid--simple-logs h-full"
              rowHeight={40}
              headerRowHeight={0}
              onSelectedCellChange={({ rowIdx }) => {
                setFocusedLog(data[rowIdx] as LogData)
              }}
              selectedRows={new Set([])}
              noRowsFallback={
                <div className="mx-auto flex h-full w-full items-center justify-center space-y-12 py-4 transition-all delay-200 duration-500">
                  {renderNoResultAlert()}
                </div>
              }
              columns={ColumnRenderer}
              rowClass={(row) => {
                return cn([
                  'font-mono tracking-tight',
                  isEqual(row, focusedLog)
                    ? 'bg-scale-800 rdg-row--focused'
                    : ' bg-scale-200 hover:bg-scale-300 cursor-pointer',
                  isErrorLog(row) && '!bg-warning-300',
                ])
              }}
              rows={data}
              rowKeyGetter={(row) => row.id}
              onRowClick={setFocusedLog}
              rowRenderer={RowRenderer}
            />
          </div>
          {(enabled || data.length > 0) && focusedLog ? (
            <div className="flex w-1/2 flex-col">
              <LogSelection onClose={() => setFocusedLog(null)} log={focusedLog} />
            </div>
          ) : null}
        </div>
      </section>
    </>
  )
}
export default EventsTable

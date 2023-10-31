import { isEqual } from 'lodash'
import { Loader2 } from 'lucide-react'
import { Key, useEffect, useState } from 'react'
import DataGrid, { RenderRowProps, Row } from 'react-data-grid'
import { Button, IconBroadcast, IconDatabaseChanges, IconExternalLink, IconPresence, cn } from 'ui'

import { useParams } from 'common'
import { useRouter } from 'next/router'
import LogSelection from './EventSelection'
import { LogData } from './Events.types'
import { ColumnRenderer } from './RealtimeEventColumnRenderer'

export const isErrorLog = (l: LogData) => {
  return l.event_message === 'SYSTEM' && l.metadata?.status === 'error'
}

interface EventsTableProps {
  enabled: boolean
  data?: LogData[]
  showSendEvent: () => void
}

const NoResultAlert = ({
  enabled,
  showSendEvent,
}: {
  enabled: boolean
  showSendEvent: () => void
}) => {
  const router = useRouter()
  const { ref } = useParams()

  return (
    <div className="w-full max-w-md flex items-center flex-col">
      {enabled ? <div>No Realtime events found</div> : null}
      <div className="text-foreground-lighter">Realtime event logs will be shown here</div>
      <div className="mt-4 border bg-surface-100 border-border rounded-md justify-start items-center flex flex-col w-full">
        <div className="w-full px-5 py-4 items-center gap-4 inline-flex border-b">
          <IconBroadcast size="xlarge" className="bg-brand-400 rounded w-6" />
          <div className="grow flex-col flex">
            <div className="text-foreground">Create a Broadcast event</div>
            <div className="text-foreground-lighter text-xs">Start developing in preview</div>
          </div>
          <Button type="default" onClick={showSendEvent}>
            <span>Send a test event</span>
          </Button>
        </div>
        <div className="w-full px-5 py-4 items-center gap-4 inline-flex border-b">
          <IconPresence size="xlarge" className="bg-brand-400 rounded w-6" />
          <div className="grow flex-col flex">
            <div className="text-foreground">Join from another browser tab</div>
            <div className="text-foreground-lighter text-xs">
              Experiment with presence events between multiple clients
            </div>
          </div>
          <Button type="default" iconRight={<IconExternalLink />}>
            <a href={`${router.basePath}${router.asPath}`} target="_blank">
              <span>Open inspector</span>
            </a>
          </Button>
        </div>

        <div className="w-full px-5 py-4 items-center gap-4 inline-flex border-b">
          <IconDatabaseChanges size="xlarge" className="bg-brand-400 rounded w-6" />
          <div className="grow flex-col flex">
            <div className="text-foreground">Listen to a table for changes</div>
            <div className="text-foreground-lighter text-xs">Start developing in preview</div>
          </div>
          <Button type="default" iconRight={<IconExternalLink />}>
            <a href={`${router.basePath}/project/${ref}/database/replication`} target="_blank">
              <span>Replication settings</span>
            </a>
          </Button>
        </div>
        <div className="w-full px-5 py-4 items-center gap-4 inline-flex border-b bg-background">
          <div className="grow flex-col flex">
            <div className="text-foreground">Not sure what to do?</div>
            <div className="text-foreground-lighter text-xs">Browse our documentation</div>
          </div>
          <Button type="default" iconRight={<IconExternalLink />}>
            <a href="https://supabase.com/docs/guides/realtime" target="_blank">
              <span>Docs</span>
            </a>
          </Button>
        </div>
      </div>
    </div>
  )
}

const RowRenderer = (key: Key, props: RenderRowProps<LogData, unknown>) => {
  return <Row key={key} {...props} isRowSelected={false} selectedCellIdx={undefined} />
}

const EventsTable = ({ enabled, data = [], showSendEvent }: EventsTableProps) => {
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
        <div className={cn('flex h-full flex-row border-t-4', enabled ? 'border-brand-400' : null)}>
          <div className="flex flex-grow flex-col">
            {enabled && (
              <div className="w-full h-8 px-4 bg-surface-100 border-b items-center inline-flex justify-between text-foreground-light">
                <div className="inline-flex gap-2.5 text-xs">
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
                <Button type="link" onClick={showSendEvent}>
                  <span className="underline text-foreground-light hover:text-brand-600">
                    Send test event
                  </span>
                </Button>
              </div>
            )}

            <DataGrid
              className="data-grid--simple-logs h-full"
              rowHeight={40}
              headerRowHeight={0}
              onSelectedCellChange={({ rowIdx }) => {
                setFocusedLog(data[rowIdx])
              }}
              selectedRows={new Set([])}
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
              renderers={{
                renderRow: RowRenderer,
                noRowsFallback: (
                  <div className="mx-auto flex h-full w-full items-center justify-center space-y-12 py-4 transition-all delay-200 duration-500">
                    <NoResultAlert enabled={enabled} showSendEvent={showSendEvent} />
                  </div>
                ),
              }}
            />
          </div>
          <div className="flex w-1/2 flex-col">
            <LogSelection onClose={() => setFocusedLog(null)} log={focusedLog} />
          </div>
        </div>
      </section>
    </>
  )
}
export default EventsTable

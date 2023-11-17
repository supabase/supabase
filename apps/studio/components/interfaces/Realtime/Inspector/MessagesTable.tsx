import { useParams } from 'common'
import { isEqual } from 'lodash'
import { Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { Key, useEffect, useState } from 'react'
import DataGrid, { RenderRowProps, Row } from 'react-data-grid'
import { Button, IconBroadcast, IconDatabaseChanges, IconExternalLink, IconPresence, cn } from 'ui'

import ShimmerLine from 'components/ui/ShimmerLine'
import MessageSelection from './MessageSelection'
import { LogData } from './Messages.types'
import { ColumnRenderer } from './RealtimeMessageColumnRenderer'

export const isErrorLog = (l: LogData) => {
  return l.message === 'SYSTEM' && l.metadata?.status === 'error'
}

interface MessagesTableProps {
  enabled: boolean
  data?: LogData[]
  showSendMessage: () => void
}

const NoResultAlert = ({
  enabled,
  showSendMessage,
}: {
  enabled: boolean
  showSendMessage: () => void
}) => {
  const router = useRouter()
  const { ref } = useParams()

  return (
    <div className="w-full max-w-md flex items-center flex-col">
      {enabled ? <p>No Realtime messages found</p> : null}
      <p className="text-foreground-lighter">Realtime message logs will be shown here</p>

      <div className="mt-4 border bg-surface-100 border-border rounded-md justify-start items-center flex flex-col w-full">
        <div className="w-full px-5 py-4 items-center gap-4 inline-flex border-b">
          <IconBroadcast size="xlarge" className="bg-brand-400 rounded w-6 text-brand-600" />
          <div className="grow flex-col flex">
            <p className="text-foreground">Create a Broadcast message</p>
            <p className="text-foreground-lighter text-xs">Start developing in preview</p>
          </div>
          <Button type="default" onClick={showSendMessage}>
            Send a test message
          </Button>
        </div>
        <div className="w-full px-5 py-4 items-center gap-4 inline-flex border-b">
          <IconPresence size="xlarge" className="bg-brand-400 rounded w-6 text-brand-600" />
          <div className="grow flex-col flex">
            <p className="text-foreground">Join from another browser tab</p>
            <p className="text-foreground-lighter text-xs">
              Experiment with presence messages between multiple clients
            </p>
          </div>
          <Link href={`${router.basePath}${router.asPath}`} target="_blank">
            <Button type="default" iconRight={<IconExternalLink />}>
              Open inspector
            </Button>
          </Link>
        </div>

        <div className="w-full px-5 py-4 items-center gap-4 inline-flex border-b">
          <IconDatabaseChanges size="xlarge" className="bg-brand-400 rounded w-6 text-brand-600" />
          <div className="grow flex-col flex">
            <p className="text-foreground">Listen to a table for changes</p>
            <p className="text-foreground-lighter text-xs">Start developing in preview</p>
          </div>
          <Link
            href={`${router.basePath}/project/${ref}/database/replication`}
            target="_blank"
            rel="noreferrer"
          >
            <Button type="default" iconRight={<IconExternalLink />}>
              Replication settings
            </Button>
          </Link>
        </div>
        <div className="w-full px-5 py-4 items-center gap-4 inline-flex rounded-b-md bg-background">
          <div className="grow flex-col flex">
            <p className="text-foreground">Not sure what to do?</p>
            <p className="text-foreground-lighter text-xs">Browse our documentation</p>
          </div>
          <Button type="default" iconRight={<IconExternalLink />}>
            <a href="https://supabase.com/docs/guides/realtime" target="_blank" rel="noreferrer">
              Documentation
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

const MessagesTable = ({ enabled, data = [], showSendMessage }: MessagesTableProps) => {
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
        <ShimmerLine active={enabled} />
        <div className={cn('flex h-full flex-row', enabled ? 'border-brand-400' : null)}>
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
                        ? `Found a large number of messages, showing only the latest 100...`
                        : `Found ${data.length} messages...`
                      : `No message found yet...`}
                  </div>
                </div>
                <Button type="link" onClick={showSendMessage}>
                  <span className="underline text-foreground-light hover:text-brand-600">
                    Send test message
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
                    <NoResultAlert enabled={enabled} showSendMessage={showSendMessage} />
                  </div>
                ),
              }}
            />
          </div>
          <div className="flex w-1/2 flex-col">
            <MessageSelection onClose={() => setFocusedLog(null)} log={focusedLog} />
          </div>
        </div>
      </section>
    </>
  )
}
export default MessagesTable

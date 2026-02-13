import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useParams } from 'common'
import { DocsButton } from 'components/ui/DocsButton'
import NoPermission from 'components/ui/NoPermission'
import ShimmerLine from 'components/ui/ShimmerLine'
import { useSendEventMutation } from 'data/telemetry/send-event-mutation'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { DOCS_URL } from 'lib/constants'
import { isEqual } from 'lodash'
import { ExternalLink, Loader2, Megaphone } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import DataGrid, { Row } from 'react-data-grid'
import { Button, cn, IconBroadcast, IconDatabaseChanges, IconPresence } from 'ui'
import { GenericSkeletonLoader } from 'ui-patterns'

import type { LogData } from './Messages.types'
import MessageSelection from './MessageSelection'
import NoChannelEmptyState from './NoChannelEmptyState'
import { ColumnRenderer } from './RealtimeMessageColumnRenderer'

export const isErrorLog = (l: LogData) => {
  return l.message === 'SYSTEM' && l.metadata?.status === 'error'
}

const NoResultAlert = ({
  enabled,
  hasChannelSet,
  showSendMessage,
}: {
  enabled: boolean
  hasChannelSet: boolean
  showSendMessage: () => void
}) => {
  const { ref } = useParams()

  const { can: canReadAPIKeys, isLoading: isLoadingPermissions } = useAsyncCheckPermissions(
    PermissionAction.READ,
    'service_api_keys'
  )

  return (
    <div className="w-full max-w-md flex items-center flex-col">
      {isLoadingPermissions ? (
        <GenericSkeletonLoader className="w-80" />
      ) : !canReadAPIKeys ? (
        <NoPermission isFullPage resourceText="use the realtime inspector" />
      ) : !hasChannelSet ? (
        <NoChannelEmptyState />
      ) : (
        <>
          {enabled && <p className="text-foreground">No Realtime messages found</p>}
          <p className="text-foreground-lighter">Realtime message logs will be shown here</p>

          <div className="mt-4 border bg-surface-100 border-border rounded-md justify-start items-center flex flex-col w-full">
            <div className="w-full px-5 py-4 items-center gap-4 inline-flex border-b">
              <IconBroadcast size="xlarge" className="text-background bg-foreground rounded w-6" />
              <div className="grow flex-col flex">
                <p className="text-foreground">Create a Broadcast message</p>
                <p className="text-foreground-lighter text-xs">Send a message in the channel</p>
              </div>
              <Button type="default" onClick={showSendMessage}>
                Broadcast a message
              </Button>
            </div>
            <div className="w-full px-5 py-4 items-center gap-4 inline-flex border-b">
              <IconPresence size="xlarge" className="text-background bg-foreground rounded w-6" />
              <div className="grow flex-col flex">
                <p className="text-foreground">Join from another browser tab</p>
                <p className="text-foreground-lighter text-xs">
                  Send messages between multiple clients
                </p>
              </div>
              <Link href={`/project/${ref}/realtime/inspector`} target="_blank" rel="noreferrer">
                <Button type="default" iconRight={<ExternalLink />}>
                  Open inspector
                </Button>
              </Link>
            </div>

            <div className="w-full px-5 py-4 items-center gap-4 inline-flex border-b">
              <IconDatabaseChanges
                size="xlarge"
                className="text-background bg-foreground rounded w-6"
              />
              <div className="grow flex-col flex">
                <p className="text-foreground">Listen to a table for changes</p>
                <p className="text-foreground-lighter text-xs">Tables must have realtime enabled</p>
              </div>
              <Link href={`/project/${ref}/database/publications`} target="_blank" rel="noreferrer">
                <Button type="default" iconRight={<ExternalLink />}>
                  Publications settings
                </Button>
              </Link>
            </div>
            <div className="w-full px-5 py-4 items-center gap-4 inline-flex rounded-b-md bg-studio">
              <div className="grow flex-col flex">
                <p className="text-foreground">Not sure what to do?</p>
                <p className="text-foreground-lighter text-xs">Browse our documentation</p>
              </div>
              <DocsButton href={`${DOCS_URL}/guides/realtime`} />
            </div>
          </div>
        </>
      )}
    </div>
  )
}

interface MessagesTableProps {
  enabled: boolean
  data?: LogData[]
  hasChannelSet: boolean
  showSendMessage: () => void
}

const MessagesTable = ({
  enabled,
  hasChannelSet,
  data = [],
  showSendMessage,
}: MessagesTableProps) => {
  const [focusedLog, setFocusedLog] = useState<LogData | null>(null)
  const stringData = JSON.stringify(data)

  const { ref } = useParams()
  const { data: org } = useSelectedOrganizationQuery()
  const { mutate: sendEvent } = useSendEventMutation()

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
      <section className="flex w-full flex-col md:max-h-[calc(100vh-var(--header-height)-3rem)]">
        <ShimmerLine active={enabled} />
        <div className={cn('flex h-full flex-row', enabled ? 'border-brand-400' : null)}>
          <div className="flex flex-grow flex-col">
            {enabled && (
              <div className="w-full h-9 px-4 bg-surface-100 items-center inline-flex justify-between text-foreground-light">
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
                <Button
                  type="default"
                  onClick={showSendMessage}
                  icon={<Megaphone strokeWidth={1.5} />}
                >
                  <span>Broadcast a message</span>
                </Button>
              </div>
            )}

            <DataGrid
              className="data-grid--simple-logs h-full border-b-0"
              rowHeight={40}
              headerRowHeight={0}
              columns={ColumnRenderer}
              rowClass={(row) => {
                return cn([
                  'font-mono tracking-tight',
                  isEqual(row, focusedLog)
                    ? 'bg-scale-800 rdg-row--focused'
                    : 'bg-200 hover:bg-scale-300 cursor-pointer',
                  isErrorLog(row) && '!bg-warning-300',
                ])
              }}
              rows={data}
              rowKeyGetter={(row) => row.id}
              renderers={{
                renderRow(idx, props) {
                  const { row } = props
                  return (
                    <Row
                      key={idx}
                      {...props}
                      isRowSelected={false}
                      selectedCellIdx={undefined}
                      onClick={() => {
                        sendEvent({
                          action: 'realtime_inspector_message_clicked',
                          groups: {
                            project: ref ?? 'Unknown',
                            organization: org?.slug ?? 'Unknown',
                          },
                        })
                        setFocusedLog(row)
                      }}
                    />
                  )
                },
                noRowsFallback: (
                  <div className="mx-auto flex h-full w-full items-center justify-center space-y-12 py-4 transition-all delay-200 duration-500">
                    <NoResultAlert
                      enabled={enabled}
                      hasChannelSet={hasChannelSet}
                      showSendMessage={showSendMessage}
                    />
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

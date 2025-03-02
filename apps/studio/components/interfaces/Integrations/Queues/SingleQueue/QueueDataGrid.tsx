import dayjs from 'dayjs'
import { TextSearch } from 'lucide-react'
import { useRouter } from 'next/router'
import { parseAsInteger, useQueryState } from 'nuqs'
import { UIEvent, useMemo, useRef } from 'react'
import DataGrid, { Column, DataGridHandle, Row } from 'react-data-grid'

import { PostgresQueueMessage } from 'data/database-queues/database-queue-messages-infinite-query'
import { Badge, Button, ResizableHandle, ResizablePanel, ResizablePanelGroup, cn } from 'ui'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'
import { DATE_FORMAT, MessageDetailsPanel } from './MessageDetailsPanel'
import { ResponseError } from 'types'
import AlertError from 'components/ui/AlertError'

interface QueueDataGridProps {
  error?: ResponseError | null
  isLoading: boolean
  messages: PostgresQueueMessage[]
  showMessageModal: () => void
  fetchNextPage: () => void
}

function isAtBottom({ currentTarget }: UIEvent<HTMLDivElement>): boolean {
  return currentTarget.scrollTop + 10 >= currentTarget.scrollHeight - currentTarget.clientHeight
}

const messagesCols = [
  {
    id: 'id',
    name: 'ID',
    description: undefined,
    minWidth: 50,
    width: 70,
    value: (row: PostgresQueueMessage) => (
      <div className="flex items-center gap-1.5">
        <h3 className="text-xs">{row.msg_id}</h3>
      </div>
    ),
  },
  {
    id: 'enqueued_at',
    name: 'Added at',
    description: undefined,
    minWidth: 160,
    width: 180,
    value: (row: PostgresQueueMessage) => (
      <div className="flex items-center gap-1 text-xs">
        {dayjs(row.enqueued_at).format(DATE_FORMAT)}
      </div>
    ),
  },
  {
    id: 'status',
    name: 'Status',
    description: undefined,
    minWidth: 280,
    width: 300,
    value: (row: PostgresQueueMessage) => {
      const isAvailable = new Date() > new Date(row.vt)

      if (row.archived_at) {
        return (
          <Badge variant="default">Archived at {dayjs(row.archived_at).format(DATE_FORMAT)}</Badge>
        )
      }

      return (
        <Badge variant={isAvailable ? 'brand' : 'warning'}>
          {isAvailable ? 'Available ' : `Available at ${dayjs(row.vt).format(DATE_FORMAT)}`}
        </Badge>
      )
    },
  },
  {
    id: 'retries',
    name: 'Retries',
    description: undefined,
    minWidth: 50,
    width: 70,
    value: (row: PostgresQueueMessage) => <span>{row.read_ct}</span>,
  },
  {
    id: 'payload',
    name: 'Payload',
    description: undefined,
    minWidth: 600,
    value: (row: PostgresQueueMessage) => <span>{JSON.stringify(row.message)}</span>,
  },
]

const columns = messagesCols.map((col) => {
  const result: Column<PostgresQueueMessage> = {
    key: col.id,
    name: col.name,
    resizable: true,
    minWidth: col.minWidth ?? 120,
    width: col.width,
    headerCellClass: 'first:pl-6 cursor-pointer',
    renderHeaderCell: () => {
      return (
        <div className="flex items-center justify-between font-normal text-xs w-full">
          <div className="flex items-center gap-x-2">
            <p className="!text-foreground">{col.name}</p>
            {col.description && <p className="text-foreground-lighter">{col.description}</p>}
          </div>
        </div>
      )
    },
    renderCell: (props) => {
      const value = col.value(props.row)

      return (
        <div
          className={cn(
            'w-full flex flex-col justify-center font-mono text-xs',
            typeof value === 'number' ? 'text-right' : ''
          )}
        >
          <span>{value}</span>
        </div>
      )
    },
  }
  return result
})

export const QueueMessagesDataGrid = ({
  error,
  isLoading,
  messages,
  showMessageModal,
  fetchNextPage,
}: QueueDataGridProps) => {
  const gridRef = useRef<DataGridHandle>(null)
  const router = useRouter()

  const [selectedMessageId, setSelectedMessageId] = useQueryState('messageId', parseAsInteger)

  const handleScroll = (event: UIEvent<HTMLDivElement>) => {
    if (isLoading || !isAtBottom(event)) return
    fetchNextPage()
  }

  const selectedMessage = useMemo(
    () => messages.find((m) => m.msg_id === selectedMessageId),
    [messages, selectedMessageId]
  )

  return (
    <div className="relative h-full">
      <DataGrid
        ref={gridRef}
        className="h-full"
        rowHeight={44}
        headerRowHeight={36}
        columns={columns}
        onScroll={handleScroll}
        rows={messages}
        rowClass={(message) => {
          const isSelected = message.msg_id === selectedMessageId
          return [
            `${isSelected ? 'bg-surface-300 dark:bg-surface-300' : 'bg-200'} cursor-pointer`,
            `${isSelected ? '[&>div:first-child]:border-l-4 border-l-secondary [&>div]:border-l-foreground' : ''}`,
            '[&>.rdg-cell]:border-box [&>.rdg-cell]:outline-none [&>.rdg-cell]:shadow-none',
            '[&>.rdg-cell:first-child>div]:ml-4',
          ].join(' ')
        }}
        renderers={{
          renderRow(idx, props) {
            return (
              <Row
                key={props.row.msg_id}
                {...props}
                onClick={() => {
                  if (typeof idx === 'number' && idx >= 0) {
                    setSelectedMessageId(props.row.msg_id)
                    gridRef.current?.scrollToCell({ idx: 0, rowIdx: idx })
                    const { messageId, ...rest } = router.query
                    router.push({ ...router, query: { ...rest, messageId: props.row.msg_id } })
                  }
                }}
              />
            )
          },
          noRowsFallback: isLoading ? (
            <div className="absolute top-14 px-6 w-full">
              <GenericSkeletonLoader />
            </div>
          ) : !!error ? (
            <div className="absolute top-16 px-6 flex flex-col items-center justify-center w-full gap-y-2">
              <AlertError subject="Failed to retrieve queue messages" error={error} />
            </div>
          ) : (
            <div className="absolute top-28 px-6 flex flex-col items-center justify-center w-full gap-y-2">
              <TextSearch className="text-foreground-muted" strokeWidth={1} />
              <div className="text-center">
                <p className="text-foreground">No messages found</p>
                <p className="text-foreground-light">
                  The selected queue doesn't have any messages.
                </p>
                <Button className="mt-2" onClick={() => showMessageModal()}>
                  Add message
                </Button>
              </div>
            </div>
          ),
        }}
      />
      <ResizablePanelGroup
        direction="horizontal"
        className="absolute inset-0 z-10 pointer-events-none"
        autoSaveId="queue-messages-layout-v1"
      >
        <ResizablePanel defaultSize={1} />
        {selectedMessage && (
          <>
            <ResizableHandle withHandle className="pointer-events-auto" />
            <MessageDetailsPanel
              selectedMessage={selectedMessage}
              setSelectedMessage={setSelectedMessageId}
            />
          </>
        )}
      </ResizablePanelGroup>
    </div>
  )
}

import dayjs from 'dayjs'
import { TextSearch } from 'lucide-react'
import { useRouter } from 'next/router'
import { parseAsInteger, useQueryState } from 'nuqs'
import { UIEvent, useMemo, useRef } from 'react'
import DataGrid, { Column, DataGridHandle, Row } from 'react-data-grid'
import { Badge, Button, cn, ResizableHandle, ResizablePanel, ResizablePanelGroup } from 'ui'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import { DATE_FORMAT, MessageDetailsPanel } from './MessageDetailsPanel'
import AlertError from '@/components/ui/AlertError'
import { PostgresQueueMessage } from '@/data/database-queues/database-queue-messages-infinite-query'
import type { ResponseError } from '@/types'

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
          <div className="flex items-center">
            <Badge variant="default">
              Archived at {dayjs(row.archived_at).format(DATE_FORMAT)}
            </Badge>
          </div>
        )
      }

      return (
        <div className="flex items-center">
          <Badge variant={isAvailable ? 'success' : 'warning'}>
            {isAvailable ? 'Available ' : `Available at ${dayjs(row.vt).format(DATE_FORMAT)}`}
          </Badge>
        </div>
      )
    },
  },
  {
    id: 'retries',
    name: 'Retries',
    description: undefined,
    minWidth: 50,
    width: 70,
    value: (row: PostgresQueueMessage) => (
      <div className="flex items-center">
        <span>{row.read_ct}</span>
      </div>
    ),
  },
  {
    id: 'payload',
    name: 'Payload',
    description: undefined,
    minWidth: 600,
    value: (row: PostgresQueueMessage) => (
      <div className="flex items-center font-mono">
        <span>{JSON.stringify(row.message)}</span>
      </div>
    ),
  },
]

const columns = messagesCols.map((col) => {
  const result: Column<PostgresQueueMessage> = {
    key: col.id,
    name: col.name,
    resizable: true,
    minWidth: col.minWidth ?? 120,
    width: col.width,
    headerCellClass: undefined,
    renderHeaderCell: () => {
      return (
        <div
          className={cn(
            'flex items-center justify-between font-normal text-xs w-full',
            col.id === 'id' && 'ml-8'
          )}
        >
          <p className="!text-foreground">{col.name}</p>
        </div>
      )
    },
    renderCell: (props) => {
      const value = col.value(props.row)
      return value
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
        rowClass={() => {
          return cn(
            'cursor-pointer',
            '[&>.rdg-cell]:border-box [&>.rdg-cell]:outline-none [&>.rdg-cell]:shadow-none',
            '[&>.rdg-cell:first-child>div]:ml-8'
          )
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
        orientation="horizontal"
        className="absolute inset-0 z-10 pointer-events-none"
        autoSaveId="queue-messages-layout-v1"
      >
        <ResizablePanel />
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

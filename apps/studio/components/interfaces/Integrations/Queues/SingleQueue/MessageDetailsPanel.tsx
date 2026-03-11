import { useEscapeKeydown } from '@radix-ui/react-use-escape-keydown'
import { isNil, noop } from 'lodash'
import { Archive, Clock12, Trash2, X } from 'lucide-react'
import { useState } from 'react'

import { useParams } from 'common'
import { MonacoEditor } from 'components/grid/components/common/MonacoEditor'
import { RowAction, RowData } from 'components/interfaces/Auth/Users/UserOverview'
import { useDatabaseQueueMessageArchiveMutation } from 'data/database-queues/database-queue-messages-archive-mutation'
import { useDatabaseQueueMessageDeleteMutation } from 'data/database-queues/database-queue-messages-delete-mutation'
import { PostgresQueueMessage } from 'data/database-queues/database-queue-messages-infinite-query'
import { useDatabaseQueueMessageReadMutation } from 'data/database-queues/database-queue-messages-read-mutation'
import dayjs from 'dayjs'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { prettifyJSON } from 'lib/helpers'
import {
  Button,
  ResizablePanel,
  Separator,
  Tabs_Shadcn_,
  TabsContent_Shadcn_,
  TabsList_Shadcn_,
  TabsTrigger_Shadcn_,
} from 'ui'

export const DATE_FORMAT = 'DD MMM, YYYY HH:mm'

interface MessageDetailsPanelProps {
  selectedMessage: PostgresQueueMessage
  setSelectedMessage: (value: number | null) => void
}

const tryFormatInitialValue = (value: string) => {
  try {
    const jsonValue = JSON.parse(value)
    return JSON.stringify(jsonValue)
  } catch (err) {
    if (typeof value === 'string') {
      return value.replaceAll(`\"`, `"`)
    } else {
      return JSON.stringify(value)
    }
  }
}

export const MessageDetailsPanel = ({
  selectedMessage,
  setSelectedMessage,
}: MessageDetailsPanelProps) => {
  const { id: _id, childId: queueName } = useParams()
  const { data: project } = useSelectedProjectQuery()

  useEscapeKeydown(() => setSelectedMessage(null))

  const {
    mutate: archiveMessage,
    isPending: isLoadingArchive,
    isSuccess: isSuccessArchive,
  } = useDatabaseQueueMessageArchiveMutation()

  const {
    mutate: readMessage,
    isPending: isLoadingRead,
    isSuccess: isSuccessRead,
  } = useDatabaseQueueMessageReadMutation()

  const {
    mutate: deleteMessage,
    isPending: isLoadingDelete,
    isSuccess: isSuccessDelete,
  } = useDatabaseQueueMessageDeleteMutation()

  const initialValue = JSON.stringify(selectedMessage?.message)
  const jsonString = prettifyJSON(!isNil(initialValue) ? tryFormatInitialValue(initialValue) : '')

  const [view, setView] = useState<'details' | 'suggestion'>('details')

  return (
    <ResizablePanel
      defaultSize="30"
      maxSize="45"
      minSize="30"
      collapsible
      onResize={(panelSize) => {
        if (panelSize.asPercentage === 0) {
          setSelectedMessage(null)
        }
      }}
      className="bg-studio border-t pointer-events-auto"
    >
      <Button
        type="text"
        className="absolute top-3 right-3 px-1"
        icon={<X />}
        onClick={() => setSelectedMessage(null)}
      />

      <Tabs_Shadcn_
        value={view}
        className="flex flex-col h-full"
        onValueChange={(value: any) => {
          setView(value)
        }}
      >
        <TabsList_Shadcn_ className="px-5 flex gap-x-4 min-h-[46px]">
          <TabsTrigger_Shadcn_
            value="details"
            className="px-0 pb-0 h-full text-xs  data-[state=active]:bg-transparent !shadow-none"
          >
            Overview
          </TabsTrigger_Shadcn_>
        </TabsList_Shadcn_>
        <TabsContent_Shadcn_ value="details" className="w-full mt-0 overflow-y-auto grow">
          <div className="flex flex-col px-4 py-4 text-sm">
            <RowData property="Message ID" value={`${selectedMessage.msg_id}`} />
            <RowData
              property="Added at"
              value={dayjs(selectedMessage.enqueued_at).format(DATE_FORMAT)}
            />
            <RowData
              property="Available at"
              value={dayjs(selectedMessage.vt).format(DATE_FORMAT)}
            />
            <RowData property="Retries" value={`${selectedMessage.read_ct}`} />

            <div>
              <h3 className="text-foreground-light py-1">Payload</h3>
              <MonacoEditor
                key={selectedMessage.msg_id}
                onChange={noop}
                width="100%"
                value={jsonString || 'NULL'}
                language="json"
                readOnly
              />
            </div>
          </div>
          <Separator />
          <div className="flex flex-col px-4 py-4 -space-y-1">
            {!selectedMessage.archived_at ? (
              <>
                <RowAction
                  title="Postpone message"
                  description="The message will be postponed and won't show up in reads for 60 seconds."
                  button={{
                    icon: <Clock12 />,
                    text: 'Postpone',
                    isLoading: isLoadingRead,
                    onClick: () => {
                      readMessage({
                        projectRef: project!.ref,
                        connectionString: project?.connectionString,
                        queueName: queueName!,
                        messageId: selectedMessage.msg_id,
                        duration: 60,
                      })
                    },
                  }}
                  success={
                    isSuccessRead
                      ? {
                          title: 'Postponed',
                          description: 'The message was postponed for 60 seconds.',
                        }
                      : undefined
                  }
                />
                <RowAction
                  title="Archive message"
                  description="The message will be marked as archived and hidden from future reads by consumers. You can still access the message later."
                  button={{
                    icon: <Archive />,
                    text: 'Archive',
                    isLoading: isLoadingArchive,
                    type: 'warning',
                    onClick: () => {
                      archiveMessage({
                        projectRef: project!.ref,
                        connectionString: project?.connectionString,
                        queueName: queueName!,
                        messageId: selectedMessage.msg_id,
                      })
                    },
                  }}
                  success={
                    isSuccessArchive
                      ? {
                          title: 'Archived',
                          description: 'The message was archived successfully.',
                        }
                      : undefined
                  }
                />
                <RowAction
                  title="Delete message"
                  description="The message cannot be recovered afterwards."
                  button={{
                    icon: <Trash2 />,
                    text: 'Delete',
                    type: 'danger',
                    isLoading: isLoadingDelete,
                    onClick: () => {
                      deleteMessage({
                        projectRef: project!.ref,
                        connectionString: project?.connectionString,
                        queueName: queueName!,
                        messageId: selectedMessage.msg_id,
                      })
                    },
                  }}
                  success={
                    isSuccessDelete
                      ? {
                          title: 'Deleted',
                          description: 'The message was deleted successfully.',
                        }
                      : undefined
                  }
                />
              </>
            ) : null}
          </div>
        </TabsContent_Shadcn_>
      </Tabs_Shadcn_>
    </ResizablePanel>
  )
}

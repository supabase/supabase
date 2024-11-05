import { isNil, noop } from 'lodash'
import { Archive, X } from 'lucide-react'
import { useState } from 'react'

import { useParams } from 'common'
import { MonacoEditor } from 'components/grid/components/common/MonacoEditor'
import { RowAction, RowData } from 'components/interfaces/Auth/Users/UserOverview'
import { useDatabaseQueueMessageArchiveMutation } from 'data/database-queues/database-queue-messages-archive-mutation'
import { PostgresQueueMessage } from 'data/database-queues/database-queue-messages-infinite-query'
import dayjs from 'dayjs'
import { useSelectedProject } from 'hooks/misc/useSelectedProject'
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
  const { id: _id } = useParams()
  const { name: queueName } = useParams()
  const project = useSelectedProject()

  const { mutate, isLoading, isSuccess } = useDatabaseQueueMessageArchiveMutation()

  const initialValue = JSON.stringify(selectedMessage?.message)
  const jsonString = prettifyJSON(!isNil(initialValue) ? tryFormatInitialValue(initialValue) : '')

  const [view, setView] = useState<'details' | 'suggestion'>('details')

  return (
    <ResizablePanel
      defaultSize={30}
      maxSize={45}
      minSize={30}
      collapsible
      onCollapse={() => setSelectedMessage(null)}
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
              <h3 className="text-foreground-light pt-1">Payload</h3>
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
          <div className="flex flex-col px-4 py-4">
            {!selectedMessage.archived_at ? (
              <RowAction
                title="Archive message"
                description="The message will be marked as archived and hidden from future reads by consumers"
                button={{
                  icon: <Archive />,
                  text: 'Archive',
                  isLoading: isLoading,
                  onClick: () => {
                    mutate({
                      projectRef: project!.ref,
                      connectionString: project?.connectionString,
                      queryName: queueName!,
                      messageId: selectedMessage.msg_id,
                    })
                  },
                }}
                success={
                  isSuccess
                    ? {
                        title: 'Archived',
                        description: 'The message is archived successfully.',
                      }
                    : undefined
                }
              />
            ) : null}
          </div>
        </TabsContent_Shadcn_>
      </Tabs_Shadcn_>
    </ResizablePanel>
  )
}

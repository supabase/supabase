import { Paintbrush, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'

import { useParams } from 'common'
import DeleteQueue from 'components/interfaces/Integrations/Queues/SingleQueue/DeleteQueue'
import PurgeQueue from 'components/interfaces/Integrations/Queues/SingleQueue/PurgeQueue'
import { QUEUE_MESSAGE_TYPE } from 'components/interfaces/Integrations/Queues/SingleQueue/Queue.utils'
import { QueueMessagesDataGrid } from 'components/interfaces/Integrations/Queues/SingleQueue/QueueDataGrid'
import { QueueFilters } from 'components/interfaces/Integrations/Queues/SingleQueue/QueueFilters'
import { QueueSettings } from 'components/interfaces/Integrations/Queues/SingleQueue/QueueSettings'
import { SendMessageModal } from 'components/interfaces/Integrations/Queues/SingleQueue/SendMessageModal'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { useQueueMessagesInfiniteQuery } from 'data/database-queues/database-queue-messages-infinite-query'
import { Button, LoadingLine, Separator } from 'ui'

export const QueueTab = () => {
  const { childId: queueName } = useParams()
  const { project } = useProjectContext()
  const [sendMessageModalShown, setSendMessageModalShown] = useState(false)
  const [purgeQueueModalShown, setPurgeQueueModalShown] = useState(false)
  const [deleteQueueModalShown, setDeleteQueueModalShown] = useState(false)
  const [selectedTypes, setSelectedTypes] = useState<QUEUE_MESSAGE_TYPE[]>([])

  const { data, error, isLoading, fetchNextPage, isFetching } = useQueueMessagesInfiniteQuery(
    {
      projectRef: project?.ref,
      connectionString: project?.connectionString,
      queueName: queueName!,
      // when no types are selected, include all types of messages
      status: selectedTypes.length === 0 ? ['archived', 'available', 'scheduled'] : selectedTypes,
    },
    { staleTime: 30 }
  )
  const messages = useMemo(() => data?.pages.flatMap((p) => p), [data?.pages])

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-end gap-x-4 py-4 px-6 mb-0">
        <div className="flex gap-x-2">
          <QueueSettings />
          <ButtonTooltip
            type="text"
            className="px-1.5"
            onClick={() => setPurgeQueueModalShown(true)}
            icon={<Paintbrush />}
            title="Purge messages"
            tooltip={{ content: { side: 'bottom', text: 'Purge messages' } }}
          />
          <ButtonTooltip
            type="text"
            className="px-1.5"
            onClick={() => setDeleteQueueModalShown(true)}
            icon={<Trash2 />}
            title="Delete queue"
            tooltip={{ content: { side: 'bottom', text: 'Delete queue' } }}
          />
          <Separator orientation="vertical" className="h-[26px]" />
          <Button type="primary" onClick={() => setSendMessageModalShown(true)}>
            Add message
          </Button>

          {/* <DocsButton href={docsUrl} />} */}
        </div>
      </div>

      <QueueFilters selectedTypes={selectedTypes} setSelectedTypes={setSelectedTypes} />
      <LoadingLine loading={isFetching} />
      <QueueMessagesDataGrid
        error={error}
        messages={messages || []}
        isLoading={isLoading}
        showMessageModal={() => setSendMessageModalShown(true)}
        fetchNextPage={fetchNextPage}
      />
      <SendMessageModal
        visible={sendMessageModalShown}
        onClose={() => setSendMessageModalShown(false)}
      />
      <DeleteQueue
        queueName={queueName!}
        visible={deleteQueueModalShown}
        onClose={() => setDeleteQueueModalShown(false)}
      />
      <PurgeQueue
        queueName={queueName!}
        visible={purgeQueueModalShown}
        onClose={() => setPurgeQueueModalShown(false)}
      />
    </div>
  )
}

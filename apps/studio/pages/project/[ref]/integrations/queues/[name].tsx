import { useMemo, useState } from 'react'

import { useParams } from 'common'
import DeleteQueue from 'components/interfaces/Integrations/Queues/SingleQueue/DeleteQueue'
import { QUEUE_MESSAGE_TYPE } from 'components/interfaces/Integrations/Queues/SingleQueue/Queue.utils'
import { QueueMessagesDataGrid } from 'components/interfaces/Integrations/Queues/SingleQueue/QueueDataGrid'
import { QueueFilters } from 'components/interfaces/Integrations/Queues/SingleQueue/QueueFilters'
import ProjectIntegrationsLayout from 'components/layouts/ProjectIntegrationsLayout/ProjectIntegrationsLayout'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { FormHeader } from 'components/ui/Forms/FormHeader'
import { useQueueMessagesInfiniteQuery } from 'data/database-queues/database-queue-messages-infinite-query'
import type { NextPageWithLayout } from 'types'
import { Button, LoadingLine } from 'ui'

const QueueMessagesPage: NextPageWithLayout = () => {
  // TODO: Change this to the correct permissions
  // const canReadFunctions = useCheckPermissions(PermissionAction.TENANT_SQL_ADMIN_READ, 'functions')
  // const isPermissionsLoaded = usePermissionsLoaded()

  // if (isPermissionsLoaded && !canReadFunctions) {
  //   return <NoPermission isFullPage resourceText="manage database queues" />
  // }

  const { name: queueName } = useParams()
  const { project } = useProjectContext()
  const [deleteQueueModalShown, setDeleteQueueModalShown] = useState(false)
  const [selectedTypes, setSelectedTypes] = useState<QUEUE_MESSAGE_TYPE[]>([])

  const { data, isLoading, isError, fetchNextPage, isFetching } = useQueueMessagesInfiniteQuery(
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

  if (isLoading && isError) {
    return null
  }

  return (
    <div className="h-full flex flex-col">
      <FormHeader
        className="py-4 px-6 !mb-0"
        title={`Queue ${queueName}`}
        actions={
          <Button type="danger" onClick={() => setDeleteQueueModalShown(true)}>
            Delete the queue
          </Button>
        }
      />

      <QueueFilters selectedTypes={selectedTypes} setSelectedTypes={setSelectedTypes} />
      <LoadingLine loading={isFetching} />
      <QueueMessagesDataGrid
        messages={messages || []}
        isLoading={isLoading}
        fetchNextPage={fetchNextPage}
      />
      <DeleteQueue
        queueName={queueName!}
        visible={deleteQueueModalShown}
        onClose={() => setDeleteQueueModalShown(false)}
      />
    </div>
  )
}

QueueMessagesPage.getLayout = (page) => (
  <ProjectIntegrationsLayout title="Queues">{page}</ProjectIntegrationsLayout>
)

export default QueueMessagesPage

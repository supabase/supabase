import dayjs from 'dayjs'
import { useRouter } from 'next/router'

import { useParams } from 'common'
import { NavigationItem, PageLayout } from 'components/layouts/PageLayout/PageLayout'
import { useQueuesQuery } from 'data/database-queues/database-queues-query'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { DATETIME_FORMAT } from 'lib/constants'
import { QueueTab } from './QueueTab'

export const QueuePage = () => {
  const router = useRouter()
  const { ref, id, pageId, childId } = useParams()
  const childLabel = router?.query?.['child-label'] as string
  const { data: project } = useSelectedProjectQuery()

  const { data: queues } = useQueuesQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  const currentQueue = queues?.find((queue) => queue.queue_name === childId)

  const breadcrumbItems = [
    {
      label: 'Integrations',
      href: `/project/${ref}/integrations`,
    },
    {
      label: 'Queues',
      href: pageId
        ? `/project/${ref}/integrations/${id}/${pageId}`
        : `/project/${ref}/integrations/${id}`,
    },
    {
      label: childId,
    },
  ]

  const navigationItems: NavigationItem[] = []

  const pageTitle = childLabel || childId || 'Queue'

  const getQueueType = (queue: typeof currentQueue) => {
    if (!queue) return 'Unknown'
    return queue.is_partitioned ? 'Partitioned' : queue.is_unlogged ? 'Unlogged' : 'Basic'
  }

  const pageSubtitle = currentQueue
    ? `${getQueueType(currentQueue)} queue created on ${dayjs(currentQueue.created_at).format(DATETIME_FORMAT)}`
    : undefined

  return (
    <PageLayout
      title={pageTitle}
      subtitle={pageSubtitle}
      size="full"
      breadcrumbs={breadcrumbItems}
      navigationItems={navigationItems}
    >
      <QueueTab />
    </PageLayout>
  )
}

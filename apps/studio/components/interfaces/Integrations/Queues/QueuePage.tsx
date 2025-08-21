import dayjs from 'dayjs'
import { useParams } from 'common'
import { PageLayout, NavigationItem } from 'components/layouts/PageLayout/PageLayout'
import { useRouter } from 'next/compat/router'
import { useQueuesQuery } from 'data/database-queues/database-queues-query'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { DATETIME_FORMAT } from 'lib/constants'
import { QueueTab } from './QueueTab'

export const QueuePage = () => {
  const router = useRouter()
  const { ref, id, pageId, childId } = useParams()
  const childLabel = router?.query?.['child-label'] as string
  const { data: project } = useSelectedProjectQuery()

  // Fetch queue data to get type and creation date
  const { data: queues } = useQueuesQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  // Find the current queue
  const currentQueue = queues?.find((queue) => queue.queue_name === childId)

  // Create breadcrumb items
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
  ]

  // No navigation items for child pages
  const navigationItems: NavigationItem[] = []

  // Page title is the queue name (childId) or custom label
  const pageTitle = childLabel || childId || 'Queue'

  // Create subtitle with queue type and creation date
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

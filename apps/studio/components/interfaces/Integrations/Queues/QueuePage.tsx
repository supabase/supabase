import dayjs from 'dayjs'
import Link from 'next/link'
import { useRouter } from 'next/router'

import { useParams } from 'common'
import { useQueuesQuery } from 'data/database-queues/database-queues-query'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { DATETIME_FORMAT } from 'lib/constants'
import {
  BreadcrumbItem_Shadcn_ as BreadcrumbItem,
  BreadcrumbLink_Shadcn_ as BreadcrumbLink,
  BreadcrumbList_Shadcn_ as BreadcrumbList,
  BreadcrumbPage_Shadcn_ as BreadcrumbPage,
  BreadcrumbSeparator_Shadcn_ as BreadcrumbSeparator,
} from 'ui'
import {
  PageHeader,
  PageHeaderBreadcrumb,
  PageHeaderDescription,
  PageHeaderMeta,
  PageHeaderSummary,
  PageHeaderTitle,
} from 'ui-patterns/PageHeader'
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

  const pageTitle = childLabel || childId || 'Queue'

  const getQueueType = (queue: typeof currentQueue) => {
    if (!queue) return 'Unknown'
    return queue.is_partitioned ? 'Partitioned' : queue.is_unlogged ? 'Unlogged' : 'Basic'
  }

  const pageSubtitle = currentQueue
    ? `${getQueueType(currentQueue)} queue created on ${dayjs(currentQueue.created_at).format(DATETIME_FORMAT)}`
    : undefined

  return (
    <>
      <PageHeader size="full" className="pb-6">
        <PageHeaderBreadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href={`/project/${ref}/integrations`}>Integrations</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link
                  href={
                    pageId
                      ? `/project/${ref}/integrations/${id}/${pageId}`
                      : `/project/${ref}/integrations/${id}`
                  }
                >
                  Queues
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{childId}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </PageHeaderBreadcrumb>
        <PageHeaderMeta>
          <PageHeaderSummary>
            <PageHeaderTitle>{pageTitle}</PageHeaderTitle>
            {pageSubtitle && <PageHeaderDescription>{pageSubtitle}</PageHeaderDescription>}
          </PageHeaderSummary>
        </PageHeaderMeta>
      </PageHeader>

      <QueueTab />
    </>
  )
}

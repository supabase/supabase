import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { AnalyticsBucket as AnalyticsBucketIcon } from 'icons'
import { useEffect } from 'react'
import { toast } from 'sonner'
import {
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from 'ui'
import { PageBreadcrumbs } from 'ui-patterns/PageBreadcrumbs'
import {
  PageHeader,
  PageHeaderAside,
  PageHeaderIcon,
  PageHeaderMeta,
  PageHeaderSummary,
  PageHeaderTitle,
} from 'ui-patterns/PageHeader'

import { AnalyticBucketDetails } from '@/components/interfaces/Storage/AnalyticsBuckets/AnalyticsBucketDetails'
import { useSelectedAnalyticsBucket } from '@/components/interfaces/Storage/AnalyticsBuckets/useSelectedAnalyticsBucket'
import { BUCKET_TYPES } from '@/components/interfaces/Storage/Storage.constants'
import { DocsButton } from '@/components/ui/DocsButton'

export const Route = createFileRoute('/project/$ref/storage/analytics/buckets/$bucketId')({
  component: AnalyticsBucketPage,
  staticData: {
    storageLayoutTitle: 'Buckets',
    skipStorageBucketsLayout: true,
  },
})

function AnalyticsBucketPage() {
  const config = BUCKET_TYPES.analytics
  const navigate = useNavigate()
  const { ref, bucketId } = Route.useParams()
  const { data: bucket, isSuccess } = useSelectedAnalyticsBucket()

  useEffect(() => {
    if (isSuccess && !bucket) {
      toast.info(`Bucket "${bucketId}" does not exist in your project`)
      void navigate({ to: '/project/$ref/storage/analytics', params: { ref } })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuccess])

  return (
    <>
      <PageBreadcrumbs>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/project/$ref/storage/analytics" params={{ ref }}>
                Analytics
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Buckets</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </PageBreadcrumbs>
      <PageHeader>
        <PageHeaderMeta>
          <PageHeaderIcon>
            <div className="shrink-0 w-10 h-10 relative bg-surface-100 border rounded-md flex items-center justify-center">
              <AnalyticsBucketIcon size={20} className="text-foreground-light" />
            </div>
          </PageHeaderIcon>
          <PageHeaderSummary>
            <PageHeaderTitle>{bucketId}</PageHeaderTitle>
          </PageHeaderSummary>
          {config?.docsUrl && (
            <PageHeaderAside>
              <DocsButton href={config.docsUrl} />
            </PageHeaderAside>
          )}
        </PageHeaderMeta>
      </PageHeader>
      <AnalyticBucketDetails />
    </>
  )
}

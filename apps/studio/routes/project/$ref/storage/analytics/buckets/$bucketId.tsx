import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { AnalyticsBucket as AnalyticsBucketIcon } from 'icons'
import { useEffect } from 'react'
import { toast } from 'sonner'

import { AnalyticBucketDetails } from '@/components/interfaces/Storage/AnalyticsBuckets/AnalyticsBucketDetails'
import { useSelectedAnalyticsBucket } from '@/components/interfaces/Storage/AnalyticsBuckets/useSelectedAnalyticsBucket'
import { BUCKET_TYPES } from '@/components/interfaces/Storage/Storage.constants'
import { PageLayout } from '@/components/layouts/PageLayout/PageLayout'
import { DocsButton } from '@/components/ui/DocsButton'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'

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
  const { data: project } = useSelectedProjectQuery()
  const { data: bucket, isSuccess } = useSelectedAnalyticsBucket()

  useEffect(() => {
    if (isSuccess && !bucket) {
      toast.info(`Bucket "${bucketId}" does not exist in your project`)
      void navigate({ to: '/project/$ref/storage/analytics', params: { ref } })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuccess])

  return (
    <PageLayout
      title={bucketId}
      icon={
        <div className="shrink-0 w-10 h-10 relative bg-surface-100 border rounded-md flex items-center justify-center">
          <AnalyticsBucketIcon size={20} className="text-foreground-light" />
        </div>
      }
      breadcrumbs={[
        {
          label: 'Analytics',
          href: `/project/${project?.ref}/storage/analytics`,
        },
        {
          label: 'Buckets',
        },
      ]}
      secondaryActions={config?.docsUrl ? [<DocsButton key="docs" href={config.docsUrl} />] : []}
    >
      <AnalyticBucketDetails />
    </PageLayout>
  )
}

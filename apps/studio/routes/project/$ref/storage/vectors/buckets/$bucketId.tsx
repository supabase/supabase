import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { VectorBucket as VectorBucketIcon } from 'icons'
import { useEffect } from 'react'
import { toast } from 'sonner'

import { BUCKET_TYPES } from '@/components/interfaces/Storage/Storage.constants'
import { useSelectedVectorBucket } from '@/components/interfaces/Storage/VectorBuckets/useSelectedVectorBuckets'
import { VectorBucketDetails } from '@/components/interfaces/Storage/VectorBuckets/VectorBucketDetails'
import { PageLayout } from '@/components/layouts/PageLayout/PageLayout'
import { DocsButton } from '@/components/ui/DocsButton'

export const Route = createFileRoute('/project/$ref/storage/vectors/buckets/$bucketId')({
  component: VectorsBucketPage,
  staticData: {
    storageLayoutTitle: 'Buckets',
    skipStorageBucketsLayout: true,
  },
})

function VectorsBucketPage() {
  const navigate = useNavigate()
  const { ref, bucketId } = Route.useParams()
  const { data: bucket, isSuccess } = useSelectedVectorBucket()

  const config = BUCKET_TYPES['vectors']

  useEffect(() => {
    if (isSuccess && !bucket) {
      toast.info(`Bucket "${bucketId}" does not exist in your project`)
      void navigate({ to: '/project/$ref/storage/vectors', params: { ref } })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuccess])

  return (
    <PageLayout
      title={bucketId}
      icon={
        <div className="shrink-0 w-10 h-10 relative bg-surface-100 border rounded-md flex items-center justify-center">
          <VectorBucketIcon size={20} className="text-foreground-light" />
        </div>
      }
      breadcrumbs={[
        { label: 'Vectors', href: `/project/${ref}/storage/vectors` },
        {
          label: 'Buckets',
        },
      ]}
      secondaryActions={config?.docsUrl ? [<DocsButton key="docs" href={config.docsUrl} />] : []}
    >
      <div className="storage-container flex grow">
        <VectorBucketDetails />
      </div>
    </PageLayout>
  )
}

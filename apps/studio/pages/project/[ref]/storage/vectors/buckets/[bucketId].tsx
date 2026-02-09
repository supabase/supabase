import { useParams } from 'common'
import { BUCKET_TYPES } from 'components/interfaces/Storage/Storage.constants'
import { VectorBucketDetails } from 'components/interfaces/Storage/VectorBuckets/VectorBucketDetails'
import { useSelectedVectorBucket } from 'components/interfaces/Storage/VectorBuckets/useSelectedVectorBuckets'
import { DefaultLayout } from 'components/layouts/DefaultLayout'
import { PageLayout } from 'components/layouts/PageLayout/PageLayout'
import StorageLayout from 'components/layouts/StorageLayout/StorageLayout'
import { DocsButton } from 'components/ui/DocsButton'
import { VectorBucket as VectorBucketIcon } from 'icons'
import { useRouter } from 'next/router'
import { useEffect } from 'react'
import { toast } from 'sonner'
import type { NextPageWithLayout } from 'types'

const VectorsBucketPage: NextPageWithLayout = () => {
  const router = useRouter()
  const { ref, bucketId } = useParams()
  const { data: bucket, isSuccess } = useSelectedVectorBucket()

  const config = BUCKET_TYPES['vectors']

  useEffect(() => {
    if (isSuccess && !bucket) {
      toast.info(`Bucket "${bucketId}" does not exist in your project`)
      router.push(`/project/${ref}/storage/vectors`)
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
      <div className="storage-container flex flex-grow">
        <VectorBucketDetails />
      </div>
    </PageLayout>
  )
}

VectorsBucketPage.getLayout = (page) => (
  <DefaultLayout>
    <StorageLayout title="Buckets">{page}</StorageLayout>
  </DefaultLayout>
)

export default VectorsBucketPage

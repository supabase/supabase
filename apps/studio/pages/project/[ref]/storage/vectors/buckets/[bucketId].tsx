import { useParams } from 'common'
import { BUCKET_TYPES } from 'components/interfaces/Storage/Storage.constants'
import { VectorBucketDetails } from 'components/interfaces/Storage/VectorBuckets/VectorBucketDetails'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { PageLayout } from 'components/layouts/PageLayout/PageLayout'
import StorageLayout from 'components/layouts/StorageLayout/StorageLayout'
import { DocsButton } from 'components/ui/DocsButton'
import { Bucket as BucketIcon } from 'icons'
import { useStorageExplorerStateSnapshot } from 'state/storage-explorer'
import type { NextPageWithLayout } from 'types'

const VectorsBucketPage: NextPageWithLayout = () => {
  const config = BUCKET_TYPES['vectors']
  const { bucketId } = useParams()
  const { projectRef } = useStorageExplorerStateSnapshot()

  return (
    <PageLayout
      title={bucketId}
      icon={
        <div className="shrink-0 w-10 h-10 relative bg-surface-100 border rounded-md flex items-center justify-center">
          <BucketIcon size={20} className="text-foreground-light" />
        </div>
      }
      breadcrumbs={[
        { label: 'Vectors', href: `/project/${projectRef}/storage/vectors` },
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

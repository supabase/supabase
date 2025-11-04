import { useParams } from 'common'
import { AnalyticBucketDetails } from 'components/interfaces/Storage/AnalyticsBuckets/AnalyticsBucketDetails'
import { BUCKET_TYPES } from 'components/interfaces/Storage/Storage.constants'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { PageLayout } from 'components/layouts/PageLayout/PageLayout'
import StorageLayout from 'components/layouts/StorageLayout/StorageLayout'
import { DocsButton } from 'components/ui/DocsButton'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { useStorageExplorerStateSnapshot } from 'state/storage-explorer'
import type { NextPageWithLayout } from 'types'

const AnalyticsBucketPage: NextPageWithLayout = () => {
  const config = BUCKET_TYPES.analytics
  const { bucketId } = useParams()
  const { data: project } = useSelectedProjectQuery()
  const { projectRef } = useStorageExplorerStateSnapshot()

  // [Joshen] Checking against projectRef from storage explorer to check if the store has initialized
  // We can probably replace this with a better skeleton loader that's more representative of the page layout
  if (!project || !projectRef) return null

  return (
    <PageLayout
      title={bucketId}
      breadcrumbs={[
        {
          label: 'Analytics',
          href: `/project/${project?.ref}/storage/analytics`,
        },
      ]}
      secondaryActions={config?.docsUrl ? [<DocsButton key="docs" href={config.docsUrl} />] : []}
    >
      <AnalyticBucketDetails />
    </PageLayout>
  )
}

AnalyticsBucketPage.getLayout = (page) => (
  <DefaultLayout>
    <StorageLayout title="Buckets">{page}</StorageLayout>
  </DefaultLayout>
)

export default AnalyticsBucketPage

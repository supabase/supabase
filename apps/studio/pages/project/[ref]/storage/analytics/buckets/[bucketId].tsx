import { useParams } from 'common'
import { AnalyticBucketDetails } from 'components/interfaces/Storage/AnalyticsBuckets/AnalyticsBucketDetails'
import { BUCKET_TYPES } from 'components/interfaces/Storage/Storage.constants'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { PageLayout } from 'components/layouts/PageLayout/PageLayout'
import StorageLayout from 'components/layouts/StorageLayout/StorageLayout'
import { DocsButton } from 'components/ui/DocsButton'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import type { NextPageWithLayout } from 'types'

const AnalyticsBucketPage: NextPageWithLayout = () => {
  const config = BUCKET_TYPES.analytics
  const { bucketId } = useParams()
  const { data: project } = useSelectedProjectQuery()

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

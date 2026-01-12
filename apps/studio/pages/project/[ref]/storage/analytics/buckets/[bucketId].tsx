import { useRouter } from 'next/router'
import { useEffect } from 'react'
import { toast } from 'sonner'

import { useParams } from 'common'
import { AnalyticBucketDetails } from 'components/interfaces/Storage/AnalyticsBuckets/AnalyticsBucketDetails'
import { useSelectedAnalyticsBucket } from 'components/interfaces/Storage/AnalyticsBuckets/useSelectedAnalyticsBucket'
import { BUCKET_TYPES } from 'components/interfaces/Storage/Storage.constants'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { PageLayout } from 'components/layouts/PageLayout/PageLayout'
import StorageLayout from 'components/layouts/StorageLayout/StorageLayout'
import { DocsButton } from 'components/ui/DocsButton'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { AnalyticsBucket as AnalyticsBucketIcon } from 'icons'
import type { NextPageWithLayout } from 'types'

const AnalyticsBucketPage: NextPageWithLayout = () => {
  const config = BUCKET_TYPES.analytics
  const router = useRouter()
  const { ref, bucketId } = useParams()
  const { data: project } = useSelectedProjectQuery()
  const { data: bucket, isSuccess } = useSelectedAnalyticsBucket()

  useEffect(() => {
    if (isSuccess && !bucket) {
      toast.info(`Bucket "${bucketId}" does not exist in your project`)
      router.push(`/project/${ref}/storage/analytics`)
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

AnalyticsBucketPage.getLayout = (page) => (
  <DefaultLayout>
    <StorageLayout title="Buckets">{page}</StorageLayout>
  </DefaultLayout>
)

export default AnalyticsBucketPage

import { useFlag } from 'common'
import { useParams } from 'common'
import { useRouter } from 'next/router'
import { useEffect } from 'react'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { PageLayout } from 'components/layouts/PageLayout/PageLayout'
import { ScaffoldContainer } from 'components/layouts/Scaffold'
import StorageLayout from 'components/layouts/StorageLayout/StorageLayout'
import type { NextPageWithLayout } from 'types'

const BucketTypePage: NextPageWithLayout = () => {
  const isStorageV2 = useFlag('storageAnalyticsVector')
  const { bucketType, ref } = useParams()
  const router = useRouter()

  useEffect(() => {
    if (!isStorageV2) {
      router.replace(`/project/${ref}/storage`)
    }
  }, [isStorageV2, ref, router])

  return (
    <div>
      <p>Content for {bucketType} buckets will go here.</p>
    </div>
  )
}

BucketTypePage.getLayout = (page) => {
  // We need to get the bucketType from the router since it's not available in page.props
  const BucketTypeLayout = () => {
    const { bucketType } = useParams()
    const displayName = bucketType
      ? bucketType.charAt(0).toUpperCase() + bucketType.slice(1)
      : 'Storage'

    return (
      <DefaultLayout>
        <StorageLayout title="Storage">
          <PageLayout
            title={`${displayName} Buckets`}
            subtitle={`Manage your ${bucketType ? bucketType.toLowerCase() : 'storage'} buckets and files.`}
          >
            <ScaffoldContainer>{page}</ScaffoldContainer>
          </PageLayout>
        </StorageLayout>
      </DefaultLayout>
    )
  }

  return <BucketTypeLayout />
}

export default BucketTypePage

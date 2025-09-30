import { useFlag } from 'common'
import { useParams } from 'common'
import { useRouter } from 'next/router'
import { useEffect } from 'react'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { PageLayout } from 'components/layouts/PageLayout/PageLayout'
import { ScaffoldContainer } from 'components/layouts/Scaffold'
import StorageLayout from 'components/layouts/StorageLayout/StorageLayout'
import { BUCKET_TYPES, DEFAULT_BUCKET_TYPE } from 'components/interfaces/Storage/Storage.constants'
import type { NextPageWithLayout } from 'types'
import { DocsButton } from 'components/ui/DocsButton'

const BucketTypePage: NextPageWithLayout = () => {
  const isStorageV2 = useFlag('storageAnalyticsVector')
  const { bucketType, ref } = useParams()
  const router = useRouter()

  useEffect(() => {
    if (!isStorageV2) {
      router.replace(`/project/${ref}/storage`)
    }
  }, [isStorageV2, ref, router])

  const bucketTypeKey = bucketType || DEFAULT_BUCKET_TYPE
  const config = BUCKET_TYPES[bucketTypeKey as keyof typeof BUCKET_TYPES]

  useEffect(() => {
    if (!config) {
      router.replace(`/project/${ref}/storage`)
    }
  }, [config, ref, router])

  return (
    <div>
      {/* [Danny] Purposefully duplicated directly below StorageLayout‘s config.description for now. Will be placed in a conditional empty state in next PR. TODO: consider reusing FormHeader for non-empty state.*/}
      <p className="text-foreground-light mb-4">{config.description}</p>
      <DocsButton href={config.docsUrl} />
    </div>
  )
}

BucketTypePage.getLayout = (page) => {
  // We need to get the bucketType from the router since it's not available in page.props
  const BucketTypeLayout = () => {
    const { bucketType } = useParams()
    const bucketTypeKey = bucketType || DEFAULT_BUCKET_TYPE
    const config = BUCKET_TYPES[bucketTypeKey as keyof typeof BUCKET_TYPES]

    return (
      <DefaultLayout>
        <StorageLayout title="Storage">
          <PageLayout
            title={`${config?.displayName || 'Storage'} Buckets`}
            subtitle={config?.description || 'Manage your storage buckets and files.'}
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

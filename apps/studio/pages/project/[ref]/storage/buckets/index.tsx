import { useParams } from 'common'
import { useRouter } from 'next/router'
import { useEffect } from 'react'

import { useIsNewStorageUIEnabled } from 'components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { DEFAULT_BUCKET_TYPE } from 'components/interfaces/Storage/Storage.constants'
import StorageBucketsError from 'components/interfaces/Storage/StorageBucketsError'
import DefaultLayout from 'components/layouts/DefaultLayout'
import StorageLayout from 'components/layouts/StorageLayout/StorageLayout'
import ProductEmptyState from 'components/to-be-cleaned/ProductEmptyState'
import { useBucketsQuery } from 'data/storage/buckets-query'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { DOCS_URL } from 'lib/constants'
import type { NextPageWithLayout } from 'types'

const PageLayout: NextPageWithLayout = () => {
  const { ref } = useParams()
  const router = useRouter()
  const isStorageV2 = useIsNewStorageUIEnabled()
  const { data: project } = useSelectedProjectQuery()
  const { error, isError } = useBucketsQuery({ projectRef: ref })

  useEffect(() => {
    if (isStorageV2) {
      router.replace(`/project/${ref}/storage/${DEFAULT_BUCKET_TYPE}`)
    }
  }, [isStorageV2, ref, router])

  if (!project) return null

  if (isError) return <StorageBucketsError error={error as any} />

  return (
    <div className="storage-container flex flex-grow">
      <ProductEmptyState
        title="Storage"
        infoButtonLabel="About storage"
        infoButtonUrl={`${DOCS_URL}/guides/storage`}
      >
        <p className="text-foreground-light text-sm">
          Create buckets to store and serve any type of digital content.
        </p>
        <p className="text-foreground-light text-sm">
          Make your buckets private or public depending on your security preference.
        </p>
      </ProductEmptyState>
    </div>
  )
}

PageLayout.getLayout = (page) => (
  <DefaultLayout>
    <StorageLayout title="Buckets">{page}</StorageLayout>
  </DefaultLayout>
)

export default PageLayout

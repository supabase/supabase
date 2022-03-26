import React, { useEffect } from 'react'
import { useRouter } from 'next/router'
import { observer } from 'mobx-react-lite'
import { find } from 'lodash'

import { API_URL } from 'lib/constants'
import { withAuth, useStore } from 'hooks'
import { post } from 'lib/common/fetch'
import { PROJECT_STATUS } from 'lib/constants'
import { StorageLayout } from 'components/layouts'
import ProductEmptyState from 'components/to-be-cleaned/ProductEmptyState'
import { StorageExplorer } from 'components/to-be-cleaned/Storage'
import { useStorageStore } from 'localStores/storageExplorer/StorageExplorerStore'

/**
 * PageLayout is used to setup layout - as usual it will requires inject global store
 */
const PageLayout = () => {
  const router = useRouter()
  const { ref, bucketId } = router.query

  const { ui } = useStore()
  const project = ui.selectedProject

  const storageStore = useStorageStore()
  const { buckets, loaded, openCreateBucketModal } = storageStore

  useEffect(() => {
    if (project && project.status === PROJECT_STATUS.INACTIVE) {
      post(`${API_URL}/projects/${ref}/restore`, {})
    }
  }, [project])

  if (!project) return <div></div>

  const bucket = find(buckets, { id: bucketId })

  return (
    <StorageLayout title="Buckets">
      <div className="storage-container p-4 flex flex-grow">
        {loaded ? (
          !bucket ? (
            <div className="w-full h-full flex items-center justify-center">
              <ProductEmptyState
                title="Storage"
                ctaButtonLabel="Create a new bucket"
                infoButtonLabel="About storage"
                infoButtonUrl="https://supabase.com/docs/guides/storage"
                onClickCta={openCreateBucketModal}
              >
                <p className="text-sm text-scale-1100">
                  Create buckets to store and serve any type of digital content.
                </p>
                <p className="text-sm text-scale-1100">
                  Make your buckets private or public depending on your security preference.
                </p>
              </ProductEmptyState>
            </div>
          ) : (
            // @ts-ignore
            <StorageExplorer bucket={bucket} />
          )
        ) : (
          <div />
        )}
      </div>
    </StorageLayout>
  )
}

export default withAuth(observer(PageLayout))

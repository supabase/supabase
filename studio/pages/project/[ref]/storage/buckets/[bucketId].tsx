import React, { useEffect } from 'react'
import { useRouter } from 'next/router'
import { observer } from 'mobx-react-lite'
import { find } from 'lodash'

import { API_URL } from 'lib/constants'
import { useFlag, useStore } from 'hooks'
import { post } from 'lib/common/fetch'
import { PROJECT_STATUS } from 'lib/constants'
import { StorageLayout } from 'components/layouts'
import ProductEmptyState from 'components/to-be-cleaned/ProductEmptyState'
import { StorageExplorer } from 'components/to-be-cleaned/Storage'
import { useStorageStore } from 'localStores/storageExplorer/StorageExplorerStore'
import { NextPageWithLayout } from 'types'

/**
 * PageLayout is used to setup layout - as usual it will requires inject global store
 */
const PageLayout: NextPageWithLayout = () => {
  const router = useRouter()
  const { ref, bucketId } = router.query

  const { ui } = useStore()
  const project = ui.selectedProject

  const storageStore = useStorageStore()
  const { buckets, loaded, openCreateBucketModal } = storageStore

  const kpsEnabled = useFlag('initWithKps')

  useEffect(() => {
    if (project && project.status === PROJECT_STATUS.INACTIVE) {
      post(`${API_URL}/projects/${ref}/restore`, { kps_enabled: kpsEnabled })
    }
  }, [project])

  if (!project) return <div></div>

  const bucket = find(buckets, { id: bucketId })

  return (
    <div className="storage-container flex flex-grow p-4">
      {loaded ? (
        !bucket ? (
          <div className="flex h-full w-full items-center justify-center">
            <ProductEmptyState
              title="Storage"
              ctaButtonLabel="Create a new bucket"
              infoButtonLabel="About storage"
              infoButtonUrl="https://supabase.com/docs/guides/storage"
              onClickCta={openCreateBucketModal}
            >
              <p className="text-scale-1100 text-sm">
                Create buckets to store and serve any type of digital content.
              </p>
              <p className="text-scale-1100 text-sm">
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
  )
}

PageLayout.getLayout = (page) => <StorageLayout title="Buckets">{page}</StorageLayout>

export default observer(PageLayout)

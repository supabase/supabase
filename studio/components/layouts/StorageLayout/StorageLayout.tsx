import { FC, ReactNode, useEffect } from 'react'
import { find, filter, get as _get } from 'lodash'
import { observer } from 'mobx-react-lite'

import { useStore, withAuth } from 'hooks'
import { useParams } from 'common/hooks'
import { AutoApiService, useProjectApiQuery } from 'data/config/project-api-query'
import ProjectLayout from '../'
import StorageMenu from './StorageMenu'
import { useStorageStore } from 'localStores/storageExplorer/StorageExplorerStore'
import { formatPoliciesForStorage } from 'components/to-be-cleaned/Storage/Storage.utils'
import DeleteBucketModal from 'components/to-be-cleaned/Storage/DeleteBucketModal'
import { PROJECT_STATUS } from 'lib/constants'

interface Props {
  title: string
  children: ReactNode
}

const StorageLayout: FC<Props> = ({ title, children }) => {
  const { ui, meta } = useStore()
  const { ref: projectRef } = useParams()
  const storageExplorerStore = useStorageStore()
  const {
    selectedBucketToEdit,
    closeDeleteBucketModal,
    showDeleteBucketModal,
    deleteBucket,
    buckets,
  } = storageExplorerStore || {}

  const { data: settings, isLoading } = useProjectApiQuery({ projectRef })
  const apiService = settings?.autoApiService

  const isPaused = ui.selectedProject?.status === PROJECT_STATUS.INACTIVE

  useEffect(() => {
    if (!isLoading && apiService) initializeStorageStore(apiService)
  }, [isLoading])

  const initializeStorageStore = async (apiService: AutoApiService) => {
    if (isPaused) return

    if (apiService.endpoint) {
      storageExplorerStore.initStore(
        projectRef,
        apiService.endpoint,
        apiService.serviceApiKey,
        apiService.protocol
      )
      await storageExplorerStore.fetchBuckets()
    } else {
      ui.setNotification({
        category: 'error',
        message:
          'Failed to fetch project configuration. Try refreshing your browser, or reach out to us at support@supabase.io',
      })
    }
    storageExplorerStore.setLoaded(true)
  }

  const onSelectDeleteBucket = async (bucket: any) => {
    const res = await deleteBucket(bucket)
    // Ideally this should be within deleteBucket as its a necessary side effect
    // but we'll do so once we refactor to remove the StorageExplorerStore
    if (res) {
      const policies = meta.policies.list()
      const storageObjectsPolicies = filter(policies, { table: 'objects' })
      const formattedStorageObjectPolicies = formatPoliciesForStorage(
        buckets,
        storageObjectsPolicies
      )
      const bucketPolicies = _get(
        find(formattedStorageObjectPolicies, { name: bucket.name }),
        ['policies'],
        []
      )
      await Promise.all(
        bucketPolicies.map((policy: any) => {
          meta.policies.del(policy.id)
        })
      )
    }
  }

  return (
    <ProjectLayout title={title || 'Storage'} product="Storage" productMenu={<StorageMenu />}>
      {children}
      <DeleteBucketModal
        visible={showDeleteBucketModal}
        bucket={selectedBucketToEdit}
        onSelectCancel={closeDeleteBucketModal}
        onSelectDelete={onSelectDeleteBucket}
      />
    </ProjectLayout>
  )
}

export default withAuth(observer(StorageLayout))

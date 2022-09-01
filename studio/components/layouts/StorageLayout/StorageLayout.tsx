import { FC, ReactNode, useEffect } from 'react'
import { useRouter } from 'next/router'
import { find, filter, get as _get } from 'lodash'
import { observer } from 'mobx-react-lite'

import { useProjectSettings, useStore, withAuth } from 'hooks'
import BaseLayout from 'components/layouts'
import ProjectLayout from '../ProjectLayout/ProjectLayout'
import StorageMenu from './StorageMenu'
import { useStorageStore } from 'localStores/storageExplorer/StorageExplorerStore'
import { formatPoliciesForStorage } from 'components/to-be-cleaned/Storage/Storage.utils'
import CreateBucketModal from 'components/to-be-cleaned/Storage/CreateBucketModal'
import DeleteBucketModal from 'components/to-be-cleaned/Storage/DeleteBucketModal'
import ToggleBucketPublicModal from 'components/to-be-cleaned/Storage/ToggleBucketPublicModal'
import NoPermission from 'components/ui/NoPermission'

interface Props {
  title: string
  children: ReactNode
}

const StorageLayout: FC<Props> = ({ title, children }) => {
  const { ui, meta } = useStore()
  const router = useRouter()
  const { ref } = router.query

  const storageExplorerStore = useStorageStore()
  const {
    selectedBucketToEdit,
    closeCreateBucketModal,
    showCreateBucketModal,
    closeDeleteBucketModal,
    showDeleteBucketModal,
    closeToggleBucketPublicModal,
    showToggleBucketPublicModal,
    createBucket,
    deleteBucket,
    toggleBucketPublic,
  } = storageExplorerStore || {}

  const { services, isLoading } = useProjectSettings(ref as string | undefined)
  const apiService = find(services ?? [], (service) => service.app.id === 1)
  const projectUrl = apiService?.app_config?.endpoint ?? ''
  const serviceKey = find(apiService?.service_api_keys ?? [], (key) => key.tags === 'service_role')
  const canAccessStorage = !isLoading && services && serviceKey

  useEffect(() => {
    if (!isLoading && services) initializeStorageStore()
  }, [isLoading])

  const initializeStorageStore = async () => {
    if (projectUrl) {
      if (serviceKey) {
        storageExplorerStore.initStore(ref, projectUrl, serviceKey.api_key)
        await storageExplorerStore.fetchBuckets()
      }
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
      const formattedStorageObjectPolicies = formatPoliciesForStorage(storageObjectsPolicies)
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

  if (!isLoading && !canAccessStorage) {
    return (
      <BaseLayout>
        <main style={{ maxHeight: '100vh' }} className="flex-1 overflow-y-auto">
          <NoPermission isFullPage resourceText="access your project's storage" />
        </main>
      </BaseLayout>
    )
  }

  return (
    <ProjectLayout title={title || 'Storage'} product="Storage" productMenu={<StorageMenu />}>
      {children}
      <CreateBucketModal
        visible={showCreateBucketModal}
        onSelectCancel={closeCreateBucketModal}
        onSelectSave={createBucket}
      />
      <DeleteBucketModal
        visible={showDeleteBucketModal}
        bucket={selectedBucketToEdit}
        onSelectCancel={closeDeleteBucketModal}
        onSelectDelete={onSelectDeleteBucket}
      />
      <ToggleBucketPublicModal
        visible={showToggleBucketPublicModal}
        bucket={selectedBucketToEdit}
        onSelectCancel={closeToggleBucketPublicModal}
        onSelectSave={toggleBucketPublic}
      />
    </ProjectLayout>
  )
}

export default withAuth(observer(StorageLayout))

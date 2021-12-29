import { FC, ReactNode, useEffect } from 'react'
import { find, filter, get as _get } from 'lodash'
import { observer } from 'mobx-react-lite'

import { useStore } from 'hooks'
import { API_URL } from 'lib/constants'
import { get } from 'lib/common/fetch'
import ProjectLayout from '../ProjectLayout/ProjectLayout'
import StorageMenu from './StorageMenu'
import { useStorageStore } from 'localStores/storageExplorer/StorageExplorerStore'
import { formatPoliciesForStorage } from 'components/to-be-cleaned/Storage/Storage.utils'
import CreateBucketModal from 'components/to-be-cleaned/Storage/CreateBucketModal'
import DeleteBucketModal from 'components/to-be-cleaned/Storage/DeleteBucketModal'
import ToggleBucketPublicModal from 'components/to-be-cleaned/Storage/ToggleBucketPublicModal'

interface Props {
  title: string
  children: ReactNode
}

const StorageLayout: FC<Props> = ({ title, children }) => {
  const { ui, meta } = useStore()
  const ref = ui.selectedProject?.ref

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

  useEffect(() => {
    if (ref) {
      initializeStorageStore(ref)
    }
  }, [ref])

  const getProjectConfig = async () => {
    const { services } = await get(`${API_URL}/props/project/${ref}/settings`)
    const apiService = find(services, (service) => service.app.id === 1)
    if (apiService) {
      const projectUrl = apiService?.app_config?.endpoint ?? ''
      const serviceKey = find(apiService.service_api_keys, (key) => key.tags === 'service_role')
      const projectApiKey = serviceKey?.api_key ?? ''
      return { projectUrl, projectApiKey }
    } else {
      console.error('Storage layout: Unable to find apiService')
      return {}
    }
  }

  const initializeStorageStore = async (projectRef: any) => {
    try {
      const { projectUrl, projectApiKey } = await getProjectConfig()
      if (projectUrl && projectApiKey) {
        storageExplorerStore.initStore(projectRef, projectUrl, projectApiKey)
        await storageExplorerStore.fetchBuckets()
      } else {
        throw new Error(
          `StorageLayout: Failed to getProjectConfig - ${projectUrl} ${projectApiKey}`
        )
      }
    } catch (error: any) {
      ui.setNotification({
        error,
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

export default observer(StorageLayout)

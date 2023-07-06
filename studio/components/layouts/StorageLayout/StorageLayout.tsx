import { ReactNode, useEffect } from 'react'

import { useParams } from 'common/hooks'
import DeleteBucketModal from 'components/to-be-cleaned/Storage/DeleteBucketModal'
import { AutoApiService, useProjectApiQuery } from 'data/config/project-api-query'
import { useSelectedProject, useStore, withAuth } from 'hooks'
import { PROJECT_STATUS } from 'lib/constants'
import { useStorageStore } from 'localStores/storageExplorer/StorageExplorerStore'
import ProjectLayout from '../'
import StorageMenu from './StorageMenu'

export interface StorageLayoutProps {
  title: string
  children: ReactNode
}

const StorageLayout = ({ title, children }: StorageLayoutProps) => {
  const { ui } = useStore()
  const { ref: projectRef } = useParams()
  const project = useSelectedProject()

  const storageExplorerStore = useStorageStore()
  const { selectedBucketToEdit, closeDeleteBucketModal, showDeleteBucketModal } =
    storageExplorerStore || {}

  const { data: settings, isLoading } = useProjectApiQuery({ projectRef })
  const apiService = settings?.autoApiService

  const isPaused = project?.status === PROJECT_STATUS.INACTIVE

  useEffect(() => {
    if (!isLoading && apiService) initializeStorageStore(apiService)
  }, [isLoading, projectRef])

  const initializeStorageStore = async (apiService: AutoApiService) => {
    if (isPaused) return

    if (apiService.endpoint) {
      storageExplorerStore.initStore(
        projectRef,
        apiService.endpoint,
        apiService.serviceApiKey,
        apiService.protocol
      )
    } else {
      ui.setNotification({
        category: 'error',
        message:
          'Failed to fetch project configuration. Try refreshing your browser, or reach out to us at support@supabase.io',
      })
    }
    storageExplorerStore.setLoaded(true)
  }

  return (
    <ProjectLayout title={title || 'Storage'} product="Storage" productMenu={<StorageMenu />}>
      {children}
      <DeleteBucketModal
        visible={showDeleteBucketModal}
        bucket={selectedBucketToEdit}
        onClose={closeDeleteBucketModal}
      />
    </ProjectLayout>
  )
}

export default withAuth(StorageLayout)

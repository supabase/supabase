import { useParams } from 'common'
import { ReactNode, useEffect } from 'react'
import toast from 'react-hot-toast'

import { AutoApiService, useProjectApiQuery } from 'data/config/project-api-query'
import { useSelectedProject } from 'hooks/misc/useSelectedProject'
import { withAuth } from 'hooks/misc/withAuth'
import { PROJECT_STATUS } from 'lib/constants'
import { useStorageStore } from 'localStores/storageExplorer/StorageExplorerStore'
import ProjectLayout from '../ProjectLayout/ProjectLayout'
import StorageMenu from './StorageMenu'

export interface StorageLayoutProps {
  title: string
  children: ReactNode
}

const StorageLayout = ({ title, children }: StorageLayoutProps) => {
  const { ref: projectRef } = useParams()
  const project = useSelectedProject()
  const storageExplorerStore = useStorageStore()

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
        projectRef!,
        apiService.endpoint,
        apiService.serviceApiKey,
        apiService.protocol
      )
    } else {
      toast.error(
        'Failed to fetch project configuration. Try refreshing your browser, or reach out to us at support@supabase.io'
      )
    }
  }

  return (
    <ProjectLayout title={title || 'Storage'} product="Storage" productMenu={<StorageMenu />}>
      {children}
    </ProjectLayout>
  )
}

export default withAuth(StorageLayout)

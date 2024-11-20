import { useParams } from 'common'
import { ReactNode, useEffect } from 'react'
import { toast } from 'sonner'

import { getAPIKeys, useProjectSettingsV2Query } from 'data/config/project-settings-v2-query'
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

  const { data: settings, isLoading } = useProjectSettingsV2Query({ projectRef })
  const endpoint = settings?.app_config?.endpoint
  const { serviceKey } = getAPIKeys(settings)

  const isPaused = project?.status === PROJECT_STATUS.INACTIVE

  useEffect(() => {
    if (!isLoading && endpoint && serviceKey?.api_key) {
      initializeStorageStore(endpoint, serviceKey.api_key)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, projectRef, endpoint, serviceKey?.api_key])

  const initializeStorageStore = async (endpoint: string, serviceApiKey: string) => {
    if (isPaused) return

    if (endpoint) {
      const protocol = settings?.app_config?.protocol ?? 'https'
      storageExplorerStore.initStore(projectRef!, endpoint, serviceApiKey, protocol)
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

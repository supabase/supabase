import { ReactNode } from 'react'

import { useIsNewStorageUIEnabled } from 'components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { StorageMenu } from 'components/interfaces/Storage/StorageMenu'
import { StorageMenuV2 } from 'components/interfaces/Storage/StorageMenuV2'
import { withAuth } from 'hooks/misc/withAuth'
import ProjectLayout from '../ProjectLayout/ProjectLayout'

export interface StorageLayoutProps {
  title: string
  children: ReactNode
}

const StorageLayout = ({ title, children }: StorageLayoutProps) => {
  const isStorageV2 = useIsNewStorageUIEnabled()

  return (
    <ProjectLayout
      stickySidebarBottom={isStorageV2 ? false : true}
      title={title || 'Storage'}
      product="Storage"
      productMenu={isStorageV2 ? <StorageMenuV2 /> : <StorageMenu />}
    >
      {children}
    </ProjectLayout>
  )
}

export default withAuth(StorageLayout)

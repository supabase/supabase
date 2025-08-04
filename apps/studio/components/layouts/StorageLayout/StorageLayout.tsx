import { ReactNode } from 'react'

import StorageMenu from 'components/interfaces/Storage/StorageMenu'
import { withAuth } from 'hooks/misc/withAuth'
import ProjectLayout from '../ProjectLayout/ProjectLayout'

export interface StorageLayoutProps {
  title: string
  children: ReactNode
  stickySidebarBottom?: boolean
}

const StorageLayout = ({ title, children, stickySidebarBottom }: StorageLayoutProps) => {
  return (
    <ProjectLayout
      title={title || 'Storage'}
      product="Storage"
      productMenu={<StorageMenu />}
      stickySidebarBottom={true} // For sticky Configuration menu on Storage
    >
      {children}
    </ProjectLayout>
  )
}

export default withAuth(StorageLayout)

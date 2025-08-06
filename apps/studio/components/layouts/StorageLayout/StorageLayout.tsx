import { ReactNode } from 'react'

import StorageMenu from 'components/interfaces/Storage/StorageMenu'
import { withAuth } from 'hooks/misc/withAuth'
import ProjectLayout from '../ProjectLayout/ProjectLayout'

export interface StorageLayoutProps {
  title: string
  children: ReactNode
}

const StorageLayout = ({ title, children }: StorageLayoutProps) => {
  return (
    <ProjectLayout title={title || 'Storage'} product="Storage" productMenu={<StorageMenu />}>
      {children}
    </ProjectLayout>
  )
}

export default withAuth(StorageLayout)

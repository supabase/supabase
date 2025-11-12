import { ReactNode } from 'react'

import { StorageMenuV2 } from 'components/interfaces/Storage/StorageMenuV2'
import { withAuth } from 'hooks/misc/withAuth'
import { ProjectLayout } from '../ProjectLayout'

export interface StorageLayoutProps {
  title: string
  children: ReactNode
}

const StorageLayout = ({ title, children }: StorageLayoutProps) => {
  return (
    <ProjectLayout title={title || 'Storage'} product="Storage" productMenu={<StorageMenuV2 />}>
      {children}
    </ProjectLayout>
  )
}

export default withAuth(StorageLayout)

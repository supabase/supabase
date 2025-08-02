import { ReactNode } from 'react'
import dynamic from 'next/dynamic'

import { withAuth } from 'hooks/misc/withAuth'
import ProjectLayout from '../ProjectLayout/ProjectLayout'

const StorageMenu = dynamic(() => import('../../interfaces/Storage/StorageMenu'), { ssr: false })

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

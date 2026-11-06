import { ReactNode } from 'react'

import { ProjectLayout } from '../ProjectLayout'
import { StorageMenuV2 } from '@/components/interfaces/Storage/StorageMenuV2'
import { withAuth } from '@/hooks/misc/withAuth'

export interface StorageLayoutProps {
  title: string
  children: ReactNode
}

const StorageLayout = ({ title, children }: StorageLayoutProps) => {
  return (
    <ProjectLayout
      product="Storage"
      browserTitle={{ section: title }}
      productMenu={<StorageMenuV2 />}
    >
      {children}
    </ProjectLayout>
  )
}

export default withAuth(StorageLayout)

import type { ReactNode } from 'react'

import { ProjectLayoutV2 } from '../NavigationV2/ProjectLayout'
import { ProjectLayout } from '../ProjectLayout'
import { useIsNavigationV2Enabled } from '@/components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { StorageMenuV2 } from '@/components/interfaces/Storage/StorageMenuV2'
import { withAuth } from '@/hooks/misc/withAuth'

export interface StorageLayoutProps {
  title: string
  children: ReactNode
}

const StorageLayout = ({ title, children }: StorageLayoutProps) => {
  const isNavigationV2 = useIsNavigationV2Enabled()

  if (isNavigationV2) {
    return (
      <ProjectLayoutV2 title={title || 'Storage'} product="Storage">
        {children}
      </ProjectLayoutV2>
    )
  }

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

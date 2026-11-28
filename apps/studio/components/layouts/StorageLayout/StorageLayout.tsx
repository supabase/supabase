import { useParams } from 'common'
import { ReactNode } from 'react'

import { ProjectLayout } from '../ProjectLayout'
import { StorageMenuV2 } from '@/components/interfaces/Storage/StorageMenuV2'
import { UnknownInterface } from '@/components/ui/UnknownInterface'
import { useIsFeatureEnabled } from '@/hooks/misc/useIsFeatureEnabled'
import { withAuth } from '@/hooks/misc/withAuth'

export interface StorageLayoutProps {
  title: string
  children: ReactNode
}

const StorageLayout = ({ title, children }: StorageLayoutProps) => {
  const { ref } = useParams()
  const storageEnabled = useIsFeatureEnabled('project_storage:all')

  if (!storageEnabled) {
    return (
      <ProjectLayout product="Storage" browserTitle={{ section: title }}>
        <UnknownInterface urlBack={`/project/${ref}`} />
      </ProjectLayout>
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

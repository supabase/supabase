import { useParams } from 'common'
import { ReactNode } from 'react'

import { ProjectLayout } from '../ProjectLayout'
import { StorageMenuV2 } from '@/components/interfaces/Storage/StorageMenuV2'
import { BannerStorageVersioningManager } from '@/components/ui/BannerStack/Banners/BannerStorageVersioning'
import { withAuth } from '@/hooks/misc/withAuth'

export interface StorageLayoutProps {
  title: string
  children: ReactNode
}

const StorageLayout = ({ title, children }: StorageLayoutProps) => {
  const { ref } = useParams()

  return (
    <ProjectLayout
      product="Storage"
      browserTitle={{ section: title }}
      productMenu={<StorageMenuV2 />}
    >
      <BannerStorageVersioningManager key={ref ?? '_'} />
      {children}
    </ProjectLayout>
  )
}

export default withAuth(StorageLayout)

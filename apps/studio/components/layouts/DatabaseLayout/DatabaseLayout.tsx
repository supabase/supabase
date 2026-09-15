import { useParams } from 'common'
import { useRouter } from 'next/router'
import type { PropsWithChildren } from 'react'

import { ProjectLayout } from '../ProjectLayout'
import { useGenerateDatabaseMenu } from './DatabaseMenu.utils'
import { ProductMenu } from '@/components/ui/ProductMenu'
import { ProductMenuShortcuts } from '@/components/ui/ProductMenu/ProductMenuShortcuts'
import { withAuth } from '@/hooks/misc/withAuth'
import { PipelineRequestStatusProvider } from '@/state/replication-pipeline-request-status'

export interface DatabaseLayoutProps {
  title: string
}

export const DatabaseProductMenu = () => {
  const router = useRouter()
  const page = router.pathname.split('/')[4]
  const menu = useGenerateDatabaseMenu()

  return <ProductMenu page={page} menu={menu} />
}

const DatabaseLayoutContent = ({ children, title }: PropsWithChildren<DatabaseLayoutProps>) => {
  const { ref: projectRef } = useParams()
  const router = useRouter()
  const page = router.pathname.split('/')[4]
  const menu = useGenerateDatabaseMenu()

  return (
    <ProjectLayout
      product="Database"
      browserTitle={{ section: title }}
      productMenu={<ProductMenu page={page} menu={menu} />}
      isBlocking={false}
    >
      <ProductMenuShortcuts menu={menu} />
      <PipelineRequestStatusProvider key={projectRef}>{children}</PipelineRequestStatusProvider>
    </ProjectLayout>
  )
}

export const DatabaseLayout = withAuth(DatabaseLayoutContent)

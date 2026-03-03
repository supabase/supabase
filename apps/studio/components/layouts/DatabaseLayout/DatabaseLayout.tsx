import { useIsColumnLevelPrivilegesEnabled } from 'components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { useIsETLPrivateAlpha } from 'components/interfaces/Database/Replication/useIsETLPrivateAlpha'
import { ProductMenu } from 'components/ui/ProductMenu'
import { useDatabaseExtensionsQuery } from 'data/database-extensions/database-extensions-query'
import { useProjectAddonsQuery } from 'data/subscriptions/project-addons-query'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { withAuth } from 'hooks/misc/withAuth'
import { useRouter } from 'next/router'
import { PropsWithChildren } from 'react'

import { ProjectLayout } from '../ProjectLayout'
import { useGenerateDatabaseMenu } from './DatabaseMenu.utils'

export interface DatabaseLayoutProps {
  title?: string
}

export const DatabaseProductMenu = () => {
  const { data: project } = useSelectedProjectQuery()
  const router = useRouter()
  const page = router.pathname.split('/')[4]
  const menu = useGenerateDatabaseMenu()

  return <ProductMenu page={page} menu={menu} />
}

const DatabaseLayout = ({ children }: PropsWithChildren<DatabaseLayoutProps>) => {
  return (
    <ProjectLayout product="Database" productMenu={<DatabaseProductMenu />} isBlocking={false}>
      {children}
    </ProjectLayout>
  )
}

export default withAuth(DatabaseLayout)

import { useRouter } from 'next/router'
import { PropsWithChildren } from 'react'

import { useIsColumnLevelPrivilegesEnabled } from 'components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { ProductMenu } from 'components/ui/ProductMenu'
import { useDatabaseExtensionsQuery } from 'data/database-extensions/database-extensions-query'
import { useProjectAddonsQuery } from 'data/subscriptions/project-addons-query'
import { useSelectedProject } from 'hooks/misc/useSelectedProject'
import { withAuth } from 'hooks/misc/withAuth'
import ProjectLayout from '../ProjectLayout/ProjectLayout'
import { generateDatabaseMenu } from './DatabaseMenu.utils'
import { useFlag } from 'hooks/ui/useFlag'

export interface DatabaseLayoutProps {
  title?: string
}

const DatabaseProductMenu = () => {
  const project = useSelectedProject()

  const router = useRouter()
  const page = router.pathname.split('/')[4]

  const { data } = useDatabaseExtensionsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })
  const { data: addons } = useProjectAddonsQuery({ projectRef: project?.ref })

  const pgNetExtensionExists = (data ?? []).find((ext) => ext.name === 'pg_net') !== undefined
  const pitrEnabled = addons?.selected_addons.find((addon) => addon.type === 'pitr') !== undefined
  const columnLevelPrivileges = useIsColumnLevelPrivilegesEnabled()
  const enablePgReplicate = useFlag('enablePgReplicate')

  return (
    <>
      <ProductMenu
        page={page}
        menu={generateDatabaseMenu(project, {
          pgNetExtensionExists,
          pitrEnabled,
          columnLevelPrivileges,
          enablePgReplicate,
        })}
      />
    </>
  )
}

const DatabaseLayout = ({ children }: PropsWithChildren<DatabaseLayoutProps>) => {
  return (
    <ProjectLayout product="Database" productMenu={<DatabaseProductMenu />} isBlocking={false}>
      {children}
    </ProjectLayout>
  )
}

export default withAuth(DatabaseLayout)

import { useRouter } from 'next/router'
import { PropsWithChildren } from 'react'

import { IS_PLATFORM } from 'common'
import { ProductMenu } from 'components/ui/ProductMenu'
import { useDatabaseExtensionsQuery } from 'data/database-extensions/database-extensions-query'
import { useSelectedProject } from 'hooks/misc/useSelectedProject'
import { withAuth } from 'hooks/misc/withAuth'
import { useFlag } from 'hooks/ui/useFlag'
import ProjectLayout from '../ProjectLayout/ProjectLayout'
import { generateProjectIntegrationsMenu } from './ProjectIntegrationsMenu.utils'

export interface ProjectIntegrationsLayoutProps {
  title: string
}

const ProjectIntegrationsMenu = () => {
  // if running on self-hosted, cron UI should be always enabled
  const cronUiEnabled = useFlag('cronUi') || !IS_PLATFORM
  const queuesUiEnabled = useFlag('queues')
  const project = useSelectedProject()

  const router = useRouter()
  const page = router.pathname.split('/')[4]

  const { data } = useDatabaseExtensionsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  const pgNetExtensionExists = (data ?? []).find((ext) => ext.name === 'pg_net') !== undefined
  const graphqlExtensionExists = (data ?? []).find((ext) => ext.name === 'pg_graphql') !== undefined
  const pgmqExtensionExists = (data ?? []).find((ext) => ext.name === 'pgmq') !== undefined

  return (
    <>
      <ProductMenu
        page={page}
        menu={generateProjectIntegrationsMenu(project, {
          pgNetExtensionExists,
          cronUiEnabled,
          queuesUiEnabled,
          graphqlExtensionExists,
          pgmqExtensionExists,
        })}
      />
    </>
  )
}

const ProjectIntegrationsLayout = ({
  children,
  title,
}: PropsWithChildren<ProjectIntegrationsLayoutProps>) => {
  return (
    <ProjectLayout
      title={title}
      product="Integrations"
      productMenu={<ProjectIntegrationsMenu />}
      isBlocking={false}
    >
      {children}
    </ProjectLayout>
  )
}

export default withAuth(ProjectIntegrationsLayout)

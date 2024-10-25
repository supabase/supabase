import { useRouter } from 'next/router'
import { PropsWithChildren } from 'react'

import { ProductMenu } from 'components/ui/ProductMenu'
import { useDatabaseExtensionsQuery } from 'data/database-extensions/database-extensions-query'
import { useSelectedProject } from 'hooks/misc/useSelectedProject'
import { withAuth } from 'hooks/misc/withAuth'
import ProjectLayout from '../ProjectLayout/ProjectLayout'
import { generateProjectIntegrationsMenu } from './ProjectIntegrationsMenu.utils'
import { useFlag } from 'hooks/ui/useFlag'

export interface ProjectIntegrationsLayoutProps {
  title?: string
}

const ProjectIntegrationsMenu = () => {
  const cronUiEnabled = useFlag('cronUi')
  const project = useSelectedProject()

  const router = useRouter()
  const page = router.pathname.split('/')[4]

  const { data } = useDatabaseExtensionsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  const pgNetExtensionExists = (data ?? []).find((ext) => ext.name === 'pg_net') !== undefined
  const graphqlExtensionExists = (data ?? []).find((ext) => ext.name === 'pg_graphql') !== undefined

  return (
    <>
      <ProductMenu
        page={page}
        menu={generateProjectIntegrationsMenu(project, {
          pgNetExtensionExists,
          cronUiEnabled,
          graphqlExtensionExists,
        })}
      />
    </>
  )
}

const ProjectIntegrationsLayout = ({
  children,
}: PropsWithChildren<ProjectIntegrationsLayoutProps>) => {
  return (
    <ProjectLayout
      product="Integrations"
      productMenu={<ProjectIntegrationsMenu />}
      isBlocking={false}
    >
      {children}
    </ProjectLayout>
  )
}

export default withAuth(ProjectIntegrationsLayout)

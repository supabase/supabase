import { observer } from 'mobx-react-lite'
import { useRouter } from 'next/router'
import { ReactElement, useEffect } from 'react'

import Error from 'components/ui/Error'
import ProductMenu from 'components/ui/ProductMenu'
import { useIsFeatureEnabled, useSelectedProject, useStore, withAuth } from 'hooks'
import { PROJECT_STATUS } from 'lib/constants'
import ProjectLayout from '../'
import { generateDocsMenu } from './DocsLayout.utils'
import { useIsAPIDocsSidePanelEnabled } from 'components/interfaces/App/FeaturePreview/FeaturePreviewContext'

function DocsLayout({ title, children }: { title: string; children: ReactElement }) {
  const router = useRouter()
  const { ui, meta } = useStore()
  const { data, isLoading, error } = meta.openApi
  const selectedProject = useSelectedProject()
  const isPaused = selectedProject?.status === PROJECT_STATUS.INACTIVE

  const isNewAPIDocsEnabled = useIsAPIDocsSidePanelEnabled()
  const hideMenu = isNewAPIDocsEnabled && router.pathname.endsWith('/graphiql')

  const { projectAuthAll: authEnabled } = useIsFeatureEnabled(['project_auth:all'])

  const getPage = () => {
    if (router.pathname.endsWith('graphiql')) return 'graphiql'

    const { page, resource } = router.query
    if (!page && !resource) return 'introduction'
    return (page || resource || '') as string
  }

  useEffect(() => {
    if (ui.selectedProjectRef && !isPaused) {
      meta.openApi.load()
    }
  }, [ui.selectedProjectRef, isPaused])

  if (error) {
    return (
      <ProjectLayout product="API Docs">
        <Error error={error} />
      </ProjectLayout>
    )
  }

  const projectRef = selectedProject?.ref ?? 'default'
  const tableNames = (data?.tables ?? []).map((table: any) => table.name)
  const functionNames = (data?.functions ?? []).map((fn: any) => fn.name)

  return (
    <ProjectLayout
      title={title || 'API Docs'}
      isLoading={isLoading}
      product="API Docs"
      productMenu={
        !hideMenu && (
          <ProductMenu
            page={getPage()}
            menu={generateDocsMenu(projectRef, tableNames, functionNames, { authEnabled })}
          />
        )
      }
    >
      {children}
    </ProjectLayout>
  )
}

export default withAuth(observer(DocsLayout))

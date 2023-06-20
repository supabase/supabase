import { observer } from 'mobx-react-lite'
import { useRouter } from 'next/router'
import { ReactElement, useEffect } from 'react'

import Error from 'components/ui/Error'
import ProductMenu from 'components/ui/ProductMenu'
import { useSelectedProject, useStore, withAuth } from 'hooks'
import { PROJECT_STATUS } from 'lib/constants'
import ProjectLayout from '../'
import { generateDocsMenu } from './DocsLayout.utils'

function DocsLayout({ title, children }: { title: string; children: ReactElement }) {
  const router = useRouter()
  const { meta } = useStore()
  const { data, isLoading, error } = meta.openApi
  const selectedProject = useSelectedProject()

  const isPaused = selectedProject?.status === PROJECT_STATUS.INACTIVE

  const getPage = () => {
    if (router.pathname.endsWith('graphiql')) return 'graphiql'

    const { page, resource } = router.query
    if (!page && !resource) return 'introduction'
    return (page || resource || '') as string
  }

  useEffect(() => {
    if (selectedProject?.ref && !isPaused) {
      meta.openApi.load()
    }
  }, [selectedProject?.ref])

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
        <ProductMenu
          page={getPage()}
          menu={generateDocsMenu(projectRef, tableNames, functionNames)}
        />
      }
    >
      {children}
    </ProjectLayout>
  )
}

export default withAuth(observer(DocsLayout))

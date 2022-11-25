import { ReactElement, useEffect } from 'react'
import { observer } from 'mobx-react-lite'
import { useRouter } from 'next/router'

import { useStore, withAuth } from 'hooks'
import Error from 'components/ui/Error'
import ProductMenu from 'components/ui/ProductMenu'
import ProjectLayout from 'components/layouts/ProjectLayout/ProjectLayout'
import { generateDocsMenu } from './DocsLayout.utils'

function DocsLayout({ title, children }: { title: string; children: ReactElement }) {
  const router = useRouter()
  const { meta, ui } = useStore()
  const { data, isLoading, error } = meta.openApi

  const getPage = () => {
    const { page, resource } = router.query
    if (!page && !resource) return 'introduction'
    return (page || resource || '') as string
  }

  useEffect(() => {
    if (ui.selectedProject?.ref) {
      meta.openApi.load()
    }
  }, [ui.selectedProject?.ref])

  if (error) {
    return (
      <ProjectLayout>
        <Error error={error} />
      </ProjectLayout>
    )
  }

  const projectRef = ui.selectedProject?.ref ?? 'default'
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

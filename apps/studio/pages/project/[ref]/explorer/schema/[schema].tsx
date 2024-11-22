import { useRouter } from 'next/router'
import { SchemaGraph } from 'components/interfaces/Database/Schemas/SchemaGraph'
import { ExplorerLayout } from 'components/layouts/explorer/layout'
import { ReactFlowProvider } from 'reactflow'
import type { NextPageWithLayout } from 'types'
import { getTabsStore, addTab } from 'state/tabs'
import { useEffect } from 'react'
import { FileJson2 } from 'lucide-react'
import { ProjectContextFromParamsProvider } from 'components/layouts/ProjectLayout/ProjectContext'

const SchemasPage: NextPageWithLayout = () => {
  const router = useRouter()
  const schema = router.query.schema as string
  const store = getTabsStore('explorer')

  useEffect(() => {
    if (schema) {
      const tabId = `schema-${schema}`

      if (!store.tabsMap[tabId]) {
        addTab('explorer', {
          id: tabId,
          type: 'schema',
          label: `Schema: ${schema}`,
          metadata: {
            schema,
          },
        })
      } else {
        store.activeTab = tabId
      }
    }
  }, [schema])

  return (
    <div className="flex-1 h-full">
      <ReactFlowProvider>
        <SchemaGraph hideSchemaSelection />
      </ReactFlowProvider>
    </div>
  )
}

SchemasPage.getLayout = (page) => (
  <ProjectContextFromParamsProvider>
    <ExplorerLayout>{page}</ExplorerLayout>
  </ProjectContextFromParamsProvider>
)

export default SchemasPage

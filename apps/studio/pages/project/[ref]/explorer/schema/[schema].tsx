import { useParams } from 'common'
import { SchemaGraph } from 'components/interfaces/Database/Schemas/SchemaGraph'
import { ExplorerLayout } from 'components/layouts/explorer/layout'
import { ProjectContextFromParamsProvider } from 'components/layouts/ProjectLayout/ProjectContext'
import { useRouter } from 'next/router'
import { useEffect } from 'react'
import { ReactFlowProvider } from 'reactflow'
import { addTab, getTabsStore } from 'state/tabs'
import type { NextPageWithLayout } from 'types'

const SchemasPage: NextPageWithLayout = () => {
  const router = useRouter()
  const { ref } = useParams()
  const schema = router.query.schema as string
  const store = getTabsStore(ref)

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

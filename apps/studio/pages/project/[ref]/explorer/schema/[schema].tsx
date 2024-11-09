import { useRouter } from 'next/router'
import { SchemaGraph } from 'components/interfaces/Database/Schemas/SchemaGraph'
import { ExplorerLayout } from 'components/layouts/explorer/layout'
import { ReactFlowProvider } from 'reactflow'
import type { NextPageWithLayout } from 'types'
import { useAtom } from 'jotai'
import { getTabsStore, addTab } from 'components/layouts/tabs/explorer-tabs.store'
import { useEffect } from 'react'
import { FileJson2 } from 'lucide-react'

const SchemasPage: NextPageWithLayout = () => {
  const router = useRouter()
  const schema = router.query.schema as string
  const [_, setTabsState] = useAtom(getTabsStore('explorer'))

  useEffect(() => {
    if (schema) {
      const schemaTab = {
        id: `schema-${schema}`,
        type: 'schema' as const,
        label: `Schema: ${schema}`,
        icon: <FileJson2 size={15} />,
        metadata: {
          schema,
        },
      }

      addTab(setTabsState, schemaTab)
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

SchemasPage.getLayout = (page) => <ExplorerLayout>{page}</ExplorerLayout>

export default SchemasPage

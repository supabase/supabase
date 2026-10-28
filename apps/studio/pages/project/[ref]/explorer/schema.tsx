import { ReactFlowProvider } from '@xyflow/react'
import { useParams } from 'common'
import { useEffect, useEffectEvent } from 'react'

import { useExplorerPreferences } from '@/components/interfaces/Account/Preferences/useExplorerPreferences'
import { SchemaGraph } from '@/components/interfaces/Database/Schemas/SchemaGraph'
import { DatabaseObjectDetails } from '@/components/interfaces/Explorer/Details/DatabaseObjectDetails'
import { SchemaDetails } from '@/components/interfaces/Explorer/Details/SchemaDetails'
import { DefaultLayout } from '@/components/layouts/DefaultLayout'
import { ExplorerLayout } from '@/components/layouts/ExplorerLayout/ExplorerLayout'
import { ENTITY_TYPE } from '@/data/entity-types/entity-type-constants'
import { useQuerySchemaState } from '@/hooks/misc/useSchemaQueryState'
import { createTabId, useTabsStateSnapshot } from '@/state/tabs'
import type { NextPageWithLayout } from '@/types'

const ExplorerSchemaPage: NextPageWithLayout = () => {
  const { ref } = useParams()
  const { selectedSchema } = useQuerySchemaState()
  const tabs = useTabsStateSnapshot()
  // The same sidebar as a query tab's, open or closed the way the user left it there.
  const { showDetails, setShowDetails } = useExplorerPreferences()

  const registerTab = useEffectEvent(() => {
    tabs.addTab({
      id: createTabId('schema', { schema: selectedSchema }),
      type: 'schema',
      label: `${selectedSchema} · Schema Visualizer`,
      metadata: { schema: selectedSchema },
      isPreview: false,
    })
  })

  useEffect(() => registerTab(), [ref, selectedSchema])

  return (
    <div className="flex h-full w-full flex-col">
      <ReactFlowProvider key={`${ref}-${selectedSchema}`}>
        {/* The tab is this schema's, and the sidebar's selector picks the schema. */}
        <SchemaGraph
          schema={selectedSchema}
          details={{
            isOpen: showDetails,
            onOpenChange: setShowDetails,
            render: (table) =>
              table ? (
                <DatabaseObjectDetails relation={{ ...table, type: ENTITY_TYPE.TABLE }} />
              ) : (
                <SchemaDetails schema={selectedSchema} />
              ),
          }}
        />
      </ReactFlowProvider>
    </div>
  )
}

ExplorerSchemaPage.getLayout = (page) => (
  <DefaultLayout>
    <ExplorerLayout>{page}</ExplorerLayout>
  </DefaultLayout>
)

export default ExplorerSchemaPage

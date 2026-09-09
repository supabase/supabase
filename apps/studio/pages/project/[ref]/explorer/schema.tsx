import { ReactFlowProvider } from '@xyflow/react'
import { useParams } from 'common'
import { useEffect, useEffectEvent } from 'react'

import { SchemaGraph } from '@/components/interfaces/Database/Schemas/SchemaGraph'
import { DefaultLayout } from '@/components/layouts/DefaultLayout'
import { ExplorerLayout } from '@/components/layouts/ExplorerLayout/ExplorerLayout'
import { useQuerySchemaState } from '@/hooks/misc/useSchemaQueryState'
import { createTabId, useTabsStateSnapshot } from '@/state/tabs'
import type { NextPageWithLayout } from '@/types'

const ExplorerSchemaPage: NextPageWithLayout = () => {
  const { ref } = useParams()
  const { selectedSchema } = useQuerySchemaState()
  const tabs = useTabsStateSnapshot()

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
        <SchemaGraph />
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

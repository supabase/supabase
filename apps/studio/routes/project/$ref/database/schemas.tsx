import { createFileRoute } from '@tanstack/react-router'
import { ReactFlowProvider } from '@xyflow/react'

import { SchemaGraph } from '@/components/interfaces/Database/Schemas/SchemaGraph'

export const Route = createFileRoute('/project/$ref/database/schemas')({
  component: SchemasPage,
  staticData: {
    databaseLayoutTitle: 'Schema Visualizer',
  },
})

function SchemasPage() {
  return (
    <div className="flex w-full h-full flex-col">
      <ReactFlowProvider>
        <SchemaGraph />
      </ReactFlowProvider>
    </div>
  )
}

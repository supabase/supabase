import { ReactFlowProvider } from 'reactflow'
import 'reactflow/dist/style.css'

import { IconLoader } from 'ui'
import { useTablesQuery } from '~/data/tables/tables-query'
import TablesGraph from './table-graph'

const SchemaGraph = ({ schema }: { schema: string }) => {
  const {
    data: tables,
    error,
    isError,
    isLoading,
  } = useTablesQuery({ schemas: [schema], includeColumns: true })

  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center space-x-2">
        <IconLoader className="animate-spin" size={14} />
        <p className="text-sm text-foreground-light">Loading table...</p>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="px-6 py-4 text-foreground-light">
        <p>Error connecting to API</p>
        <p>{`${error?.message ?? 'Unknown error'}`}</p>
      </div>
    )
  }

  return (
    <ReactFlowProvider>
      <TablesGraph tables={tables!} />
    </ReactFlowProvider>
  )
}

export default SchemaGraph

import { ReactFlowProvider } from 'reactflow'
import 'reactflow/dist/style.css'

import TablesGraph from './table-graph'

const SchemaGraph = ({ schema }: { schema: string }) => {
  return (
    <ReactFlowProvider>
      <TablesGraph schema={schema} />
    </ReactFlowProvider>
  )
}

export default SchemaGraph

import { ReactFlowProvider } from 'reactflow'

import { SchemaGraph } from 'components/interfaces/Database/Schemas/SchemaGraph'
import DatabaseLayout from 'components/layouts/DatabaseLayout/DatabaseLayout'
import type { NextPageWithLayout } from 'types'

const SchemasPage: NextPageWithLayout = () => {
  return (
    <div className="flex w-full h-full flex-col">
      <ReactFlowProvider>
        <SchemaGraph />
      </ReactFlowProvider>
    </div>
  )
}

SchemasPage.getLayout = (page) => <DatabaseLayout title="Database">{page}</DatabaseLayout>

export default SchemasPage

import { ReactFlowProvider } from 'reactflow'

import { SchemaGraph } from 'components/interfaces/Database/Schemas/SchemaGraph'
import DatabaseLayout from 'components/layouts/DatabaseLayout/DatabaseLayout'
import type { NextPageWithLayout } from 'types'
import DefaultLayout from 'components/layouts/DefaultLayout'

const SchemasPage: NextPageWithLayout = () => {
  return (
    <div className="flex w-full h-full flex-col">
      <ReactFlowProvider>
        <SchemaGraph />
      </ReactFlowProvider>
    </div>
  )
}

SchemasPage.getLayout = (page) => (
  <DefaultLayout>
    <DatabaseLayout title="Database">{page}</DatabaseLayout>
  </DefaultLayout>
)

export default SchemasPage

import { SchemaGraph } from 'components/interfaces/Database/Schemas/SchemaGraph'
import AppLayout from 'components/layouts/AppLayout/AppLayout'
import DatabaseLayout from 'components/layouts/DatabaseLayout/DatabaseLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { ReactFlowProvider } from 'reactflow'
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

SchemasPage.getLayout = (page) => (
  <AppLayout>
    <DefaultLayout>
      <DatabaseLayout title="Database">{page}</DatabaseLayout>
    </DefaultLayout>
  </AppLayout>
)

export default SchemasPage

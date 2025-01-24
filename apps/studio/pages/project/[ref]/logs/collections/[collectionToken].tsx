import { WarehouseCollectionDetail } from 'components/interfaces/DataWarehouse/WarehouseCollectionDetail'
import AppLayout from 'components/layouts/AppLayout/AppLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import LogsLayout from 'components/layouts/LogsLayout/LogsLayout'
import { NextPageWithLayout } from 'types'

const PageLayout: NextPageWithLayout = () => <WarehouseCollectionDetail />

PageLayout.getLayout = (page) => (
  <AppLayout>
    <DefaultLayout product="Collection">
      <LogsLayout>{page}</LogsLayout>
    </DefaultLayout>
  </AppLayout>
)

export default PageLayout

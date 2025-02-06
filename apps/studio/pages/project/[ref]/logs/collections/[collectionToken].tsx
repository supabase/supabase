import { WarehouseCollectionDetail } from 'components/interfaces/DataWarehouse/WarehouseCollectionDetail'
import DefaultLayout from 'components/layouts/DefaultLayout'
import LogsLayout from 'components/layouts/LogsLayout/LogsLayout'
import { NextPageWithLayout } from 'types'

const PageLayout: NextPageWithLayout = () => <WarehouseCollectionDetail />

PageLayout.getLayout = (page) => (
  <DefaultLayout>
    <LogsLayout>{page}</LogsLayout>
  </DefaultLayout>
)

export default PageLayout

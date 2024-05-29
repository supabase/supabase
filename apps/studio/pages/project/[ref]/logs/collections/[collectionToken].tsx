import { WarehouseCollectionDetail } from 'components/interfaces/DataWarehouse/WarehouseCollectionDetail'
import { LogsLayout } from 'components/layouts'
import { NextPageWithLayout } from 'types'

const PageLayout: NextPageWithLayout = () => <WarehouseCollectionDetail />

PageLayout.getLayout = (page) => <LogsLayout>{page}</LogsLayout>

export default PageLayout

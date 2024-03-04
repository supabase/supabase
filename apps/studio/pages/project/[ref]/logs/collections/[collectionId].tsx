import { DataWarehouseTableDetail } from 'components/interfaces/DataWarehouse/DataWarehouseTableDetail'
import { LogsLayout } from 'components/layouts'
import { observer } from 'mobx-react-lite'
import { NextPageWithLayout } from 'types'

const PageLayout: NextPageWithLayout = () => <DataWarehouseTableDetail />

PageLayout.getLayout = (page) => <LogsLayout>{page}</LogsLayout>

export default observer(PageLayout)

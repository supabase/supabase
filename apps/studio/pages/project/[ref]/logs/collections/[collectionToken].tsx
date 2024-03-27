import { WarehouseCollectionDetail } from 'components/interfaces/DataWarehouse/WarehouseCollectionDetail'
import { LogsLayout } from 'components/layouts'
import { observer } from 'mobx-react-lite'
import { NextPageWithLayout } from 'types'

const PageLayout: NextPageWithLayout = () => <WarehouseCollectionDetail />

PageLayout.getLayout = (page) => <LogsLayout>{page}</LogsLayout>

export default observer(PageLayout)

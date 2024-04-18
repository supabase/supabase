import WarehouseAccessTokens from 'components/interfaces/DataWarehouse/WarehouseAccessTokens'
import { LogsLayout } from 'components/layouts'
import { observer } from 'mobx-react-lite'
import { NextPageWithLayout } from 'types'

const PageLayout: NextPageWithLayout = () => <WarehouseAccessTokens />

PageLayout.getLayout = (page) => <LogsLayout>{page}</LogsLayout>

export default observer(PageLayout)

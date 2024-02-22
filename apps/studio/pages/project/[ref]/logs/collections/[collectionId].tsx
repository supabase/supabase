import CollectionDetail from 'components/interfaces/Collections/CollectionDetail'
import { LogsLayout } from 'components/layouts'
import { observer } from 'mobx-react-lite'
import { NextPageWithLayout } from 'types'

const PageLayout: NextPageWithLayout = () => <CollectionDetail />

PageLayout.getLayout = (page) => <LogsLayout>{page}</LogsLayout>

export default observer(PageLayout)

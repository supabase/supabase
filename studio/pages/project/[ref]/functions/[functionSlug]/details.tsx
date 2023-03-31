import { observer } from 'mobx-react-lite'
import { NextPageWithLayout } from 'types'
import FunctionsLayout from 'components/layouts/FunctionsLayout'
import { EdgeFunctionDetails } from 'components/interfaces/Functions'

const PageLayout: NextPageWithLayout = () => <EdgeFunctionDetails />
PageLayout.getLayout = (page) => <FunctionsLayout>{page}</FunctionsLayout>

export default observer(PageLayout)

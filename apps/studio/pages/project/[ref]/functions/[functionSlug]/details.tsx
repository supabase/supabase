import { EdgeFunctionDetails } from 'components/interfaces/Functions'
import FunctionsLayout from 'components/layouts/FunctionsLayout'
import type { NextPageWithLayout } from 'types'

const PageLayout: NextPageWithLayout = () => <EdgeFunctionDetails />
PageLayout.getLayout = (page) => <FunctionsLayout>{page}</FunctionsLayout>

export default PageLayout

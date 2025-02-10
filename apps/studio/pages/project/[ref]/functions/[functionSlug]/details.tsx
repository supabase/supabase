import { EdgeFunctionDetails } from 'components/interfaces/Functions'
import FunctionsLayout from 'components/layouts/FunctionsLayout/FunctionsLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import type { NextPageWithLayout } from 'types'

const PageLayout: NextPageWithLayout = () => <EdgeFunctionDetails />
PageLayout.getLayout = (page) => (
  <DefaultLayout>
    <FunctionsLayout>{page}</FunctionsLayout>
  </DefaultLayout>
)

export default PageLayout

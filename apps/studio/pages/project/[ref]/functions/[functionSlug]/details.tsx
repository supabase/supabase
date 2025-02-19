import { EdgeFunctionDetails } from 'components/interfaces/Functions'
import FunctionsLayout from 'components/layouts/FunctionsLayout/FunctionsLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import type { NextPageWithLayout } from 'types'

const PageLayout: NextPageWithLayout = () => (
  <div className="px-6">
    <EdgeFunctionDetails />
  </div>
)

PageLayout.getLayout = (page) => (
  <DefaultLayout>
    <FunctionsLayout>{page}</FunctionsLayout>
  </DefaultLayout>
)

export default PageLayout

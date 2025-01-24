import { EdgeFunctionDetails } from 'components/interfaces/Functions'
import AppLayout from 'components/layouts/AppLayout/AppLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import FunctionsLayout from 'components/layouts/FunctionsLayout/FunctionsLayout'
import type { NextPageWithLayout } from 'types'

const PageLayout: NextPageWithLayout = () => <EdgeFunctionDetails />
PageLayout.getLayout = (page) => (
  <AppLayout>
    <DefaultLayout product="Function">
      <FunctionsLayout>{page}</FunctionsLayout>
    </DefaultLayout>
  </AppLayout>
)

export default PageLayout

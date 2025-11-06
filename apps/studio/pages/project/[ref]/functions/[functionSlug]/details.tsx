import { EdgeFunctionDetails } from 'components/interfaces/Functions/EdgeFunctionDetails/EdgeFunctionDetails'
import DefaultLayout from 'components/layouts/DefaultLayout'
import EdgeFunctionDetailsLayout from 'components/layouts/EdgeFunctionsLayout/EdgeFunctionDetailsLayout'
import { PageContainer } from 'components/ui/PageContainer'
import { PageSection } from 'components/ui/PageSection'
import type { NextPageWithLayout } from 'types'

const PageLayout: NextPageWithLayout = () => <EdgeFunctionDetails />

PageLayout.getLayout = (page) => (
  <DefaultLayout>
    <EdgeFunctionDetailsLayout>{page}</EdgeFunctionDetailsLayout>
  </DefaultLayout>
)

export default PageLayout

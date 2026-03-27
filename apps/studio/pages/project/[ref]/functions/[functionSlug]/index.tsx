import { EdgeFunctionOverviewPageContent } from 'components/interfaces/Functions/EdgeFunctionDetails/EdgeFunctionOverviewPageContent'
import DefaultLayout from 'components/layouts/DefaultLayout'
import EdgeFunctionDetailsLayout from 'components/layouts/EdgeFunctionsLayout/EdgeFunctionDetailsLayout'
import type { NextPageWithLayout } from 'types'

const PageLayout: NextPageWithLayout = () => {
  return <EdgeFunctionOverviewPageContent />
}

PageLayout.getLayout = (page) => (
  <DefaultLayout>
    <EdgeFunctionDetailsLayout title="Overview">{page}</EdgeFunctionDetailsLayout>
  </DefaultLayout>
)

export default PageLayout

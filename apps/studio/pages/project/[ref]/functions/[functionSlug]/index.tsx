import { EdgeFunctionOverview } from '@/components/interfaces/Functions/EdgeFunctionOverview/EdgeFunctionOverview'
import { DefaultLayout } from '@/components/layouts/DefaultLayout'
import EdgeFunctionDetailsLayout from '@/components/layouts/EdgeFunctionsLayout/EdgeFunctionDetailsLayout'
import type { NextPageWithLayout } from '@/types'

const PageLayout: NextPageWithLayout = () => <EdgeFunctionOverview />

PageLayout.getLayout = (page) => (
  <DefaultLayout>
    <EdgeFunctionDetailsLayout title="Overview">{page}</EdgeFunctionDetailsLayout>
  </DefaultLayout>
)

export default PageLayout

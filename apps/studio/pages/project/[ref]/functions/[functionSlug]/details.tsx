import { EdgeFunctionDetails } from '@/components/interfaces/Functions/EdgeFunctionDetails/EdgeFunctionDetails'
import { getEdgeFunctionDetailsPageLayout } from '@/components/layouts/EdgeFunctionsLayout/EdgeFunctionDetailsPageLayout'
import type { NextPageWithLayout } from '@/types'

const PageLayout: NextPageWithLayout = () => <EdgeFunctionDetails />

PageLayout.getLayout = getEdgeFunctionDetailsPageLayout

export default PageLayout

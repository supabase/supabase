import { getEdgeFunctionDetailsPageLayout } from './layout'
import { EdgeFunctionDetails } from '@/components/interfaces/Functions/EdgeFunctionDetails/EdgeFunctionDetails'
import type { NextPageWithLayout } from '@/types'

const PageLayout: NextPageWithLayout = () => <EdgeFunctionDetails />

PageLayout.getLayout = getEdgeFunctionDetailsPageLayout

export default PageLayout

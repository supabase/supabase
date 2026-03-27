import { EdgeFunctionInvocationsPageContent } from 'components/interfaces/Functions/EdgeFunctionDetails/EdgeFunctionInvocationsPageContent'
import DefaultLayout from 'components/layouts/DefaultLayout'
import EdgeFunctionDetailsLayout from 'components/layouts/EdgeFunctionsLayout/EdgeFunctionDetailsLayout'
import type { NextPageWithLayout } from 'types'

const LogPage: NextPageWithLayout = () => <EdgeFunctionInvocationsPageContent />

LogPage.getLayout = (page) => (
  <DefaultLayout>
    <EdgeFunctionDetailsLayout title="Invocations">{page}</EdgeFunctionDetailsLayout>
  </DefaultLayout>
)

export default LogPage

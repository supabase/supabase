import { EdgeFunctionRuntimeLogsPageContent } from 'components/interfaces/Functions/EdgeFunctionDetails/EdgeFunctionRuntimeLogsPageContent'
import DefaultLayout from 'components/layouts/DefaultLayout'
import EdgeFunctionDetailsLayout from 'components/layouts/EdgeFunctionsLayout/EdgeFunctionDetailsLayout'
import type { NextPageWithLayout } from 'types'

const LogPage: NextPageWithLayout = () => <EdgeFunctionRuntimeLogsPageContent />

LogPage.getLayout = (page) => (
  <DefaultLayout>
    <EdgeFunctionDetailsLayout title="Logs">{page}</EdgeFunctionDetailsLayout>
  </DefaultLayout>
)

export default LogPage

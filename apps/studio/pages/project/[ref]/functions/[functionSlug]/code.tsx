import { EdgeFunctionCodePageContent } from 'components/interfaces/Functions/EdgeFunctionDetails/EdgeFunctionCodePageContent'
import { DefaultLayout } from 'components/layouts/DefaultLayout'
import EdgeFunctionDetailsLayout from 'components/layouts/EdgeFunctionsLayout/EdgeFunctionDetailsLayout'
import type { ReactNode } from 'react'
import type { NextPageWithLayout } from 'types'

const CodePage: NextPageWithLayout = () => <EdgeFunctionCodePageContent />

CodePage.getLayout = (page: ReactNode) => {
  return (
    <DefaultLayout>
      <EdgeFunctionDetailsLayout title="Code">{page}</EdgeFunctionDetailsLayout>
    </DefaultLayout>
  )
}

export default CodePage

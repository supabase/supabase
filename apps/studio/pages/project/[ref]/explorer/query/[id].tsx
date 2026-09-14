import { QueryTab } from '@/components/interfaces/Explorer/QueryTab'
import { DefaultLayout } from '@/components/layouts/DefaultLayout'
import { ExplorerLayout } from '@/components/layouts/ExplorerLayout/ExplorerLayout'
import type { NextPageWithLayout } from '@/types'

const QueryPage: NextPageWithLayout = () => {
  return <QueryTab />
}

QueryPage.getLayout = (page) => (
  <DefaultLayout>
    <ExplorerLayout>{page}</ExplorerLayout>
  </DefaultLayout>
)

export default QueryPage

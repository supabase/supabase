import { ExplorerQueryTab } from '@/components/interfaces/Explorer/ExplorerQueryTab'
import { DefaultLayout } from '@/components/layouts/DefaultLayout'
import { ExplorerLayout } from '@/components/layouts/ExplorerLayout/ExplorerLayout'
import type { NextPageWithLayout } from '@/types'

const QueryPage: NextPageWithLayout = () => {
  return <ExplorerQueryTab />
}

QueryPage.getLayout = (page) => (
  <DefaultLayout>
    <ExplorerLayout>{page}</ExplorerLayout>
  </DefaultLayout>
)

export default QueryPage
